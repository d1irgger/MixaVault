import json
import os
import threading
import time
import uuid

BASE_DIR = os.environ.get("HOME") or os.getcwd()
VAULT_PATH = os.path.join(BASE_DIR, "vault.json")
DIAGNOSTICS_PATH = os.path.join(BASE_DIR, "diagnostics.log")

_LOCK = threading.RLock()
_DATA = None


class VaultError(Exception):
    pass


def _ok(**kwargs):
    result = {"ok": True}
    result.update(kwargs)
    return result


def _err(message):
    return {"ok": False, "error": message}


def _now():
    return int(time.time() * 1000)


def _text(value, limit):
    return str(value if value is not None else "")[:limit]


def _diag(message):
    try:
        if os.path.exists(DIAGNOSTICS_PATH) and os.path.getsize(DIAGNOSTICS_PATH) > 128 * 1024:
            with open(DIAGNOSTICS_PATH, "r", encoding="utf-8", errors="replace") as handle:
                tail = handle.read()[-64 * 1024:]
            with open(DIAGNOSTICS_PATH, "w", encoding="utf-8") as handle:
                handle.write(tail)
        with open(DIAGNOSTICS_PATH, "a", encoding="utf-8") as handle:
            handle.write(f"[{time.strftime('%Y-%m-%dT%H:%M:%S')}] {message}\n")
    except Exception:
        pass


def _fields(raw):
    if not isinstance(raw, dict):
        raise VaultError("账户数据格式错误")

    title = _text(raw.get("title"), 120).strip()
    username = _text(raw.get("username"), 200).strip()
    password = _text(raw.get("password"), 1024)
    url = _text(raw.get("url"), 500).strip()
    note = _text(raw.get("note"), 4000).strip()

    if not title:
        title = username or "未命名"
    if not password:
        raise VaultError("密码不能为空")

    return {
        "title": title,
        "username": username,
        "password": password,
        "url": url,
        "note": note,
    }


def _new_account(raw):
    account = _fields(raw)
    now = _now()
    account.update({
        "id": uuid.uuid4().hex,
        "createdAt": now,
        "updatedAt": now,
    })
    return account


def _load():
    global _DATA
    if _DATA is not None:
        return _DATA

    if not os.path.exists(VAULT_PATH):
        _DATA = {"version": 1, "accounts": []}
        return _DATA

    try:
        with open(VAULT_PATH, "r", encoding="utf-8") as handle:
            data = json.load(handle)
    except Exception:
        raise VaultError("数据文件损坏，无法读取")

    if not isinstance(data, dict) or not isinstance(data.get("accounts"), list):
        raise VaultError("数据文件格式不正确")

    accounts = []
    seen_ids = set()
    for raw in data["accounts"]:
        try:
            account = _new_account(raw)
        except VaultError:
            continue
        account["id"] = _text(raw.get("id"), 64).strip() or account["id"]
        if account["id"] in seen_ids:
            account["id"] = uuid.uuid4().hex
        seen_ids.add(account["id"])
        account["createdAt"] = int(raw.get("createdAt") or account["createdAt"])
        account["updatedAt"] = int(raw.get("updatedAt") or account["updatedAt"])
        accounts.append(account)

    _DATA = {"version": 1, "accounts": accounts}
    return _DATA


def _save():
    data = _load()
    temp_path = VAULT_PATH + ".tmp"
    try:
        with open(temp_path, "w", encoding="utf-8") as handle:
            json.dump(data, handle, ensure_ascii=False, separators=(",", ":"))
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp_path, VAULT_PATH)
        try:
            os.chmod(VAULT_PATH, 0o600)
        except Exception:
            pass
    except Exception:
        try:
            if os.path.exists(temp_path):
                os.remove(temp_path)
        except Exception:
            pass
        raise VaultError("保存失败，请检查存储空间")


def _accounts():
    return _load()["accounts"]


def _find(account_id):
    account_id = _text(account_id, 64)
    for account in _accounts():
        if account["id"] == account_id:
            return account
    return None


def _public(account):
    return {
        "id": account["id"],
        "title": account["title"],
        "username": account["username"],
        "password": account["password"],
        "url": account["url"],
        "note": account["note"],
        "createdAt": account["createdAt"],
        "updatedAt": account["updatedAt"],
    }


def action_status(_payload):
    accounts = _accounts()
    return _ok(
        initialized=True,
        count=len(accounts),
        storage="plain-json",
        path=VAULT_PATH,
    )


def action_diagnostics(_payload):
    if not os.path.exists(DIAGNOSTICS_PATH):
        return _ok(text="")
    with open(DIAGNOSTICS_PATH, "r", encoding="utf-8", errors="replace") as handle:
        return _ok(text=handle.read()[-64 * 1024:])


def action_list(_payload):
    accounts = sorted(
        _accounts(),
        key=lambda item: (item["title"].casefold(), item["username"].casefold()),
    )
    return _ok(accounts=[_public(item) for item in accounts], count=len(accounts))


def action_save(payload):
    raw = payload.get("account") if isinstance(payload.get("account"), dict) else payload
    fields = _fields(raw)
    account_id = _text(payload.get("id") or raw.get("id"), 64).strip()
    account = _find(account_id) if account_id else None

    if account_id and account is None:
        raise VaultError("账户不存在，请刷新后重试")

    if account is None:
        account = _new_account(fields)
        _accounts().append(account)
    else:
        account.update(fields)
        account["updatedAt"] = _now()

    _save()
    return _ok(account=_public(account), count=len(_accounts()))


def action_delete(payload):
    account = _find(payload.get("id"))
    if account is None:
        raise VaultError("账户不存在")
    _accounts().remove(account)
    _save()
    return _ok(deleted=account["id"], count=len(_accounts()))


def action_import(payload):
    items = payload.get("items")
    if not isinstance(items, list):
        raise VaultError("没有可导入的数据")
    if len(items) > 5000:
        raise VaultError("单次最多导入 5000 条")

    accounts = _accounts()
    existing = {
        (item["title"].casefold(), item["username"].casefold())
        for item in accounts
    }
    added = 0
    skipped = 0
    invalid = 0

    for raw in items:
        try:
            account = _new_account(raw)
        except VaultError:
            invalid += 1
            continue
        key = (account["title"].casefold(), account["username"].casefold())
        if key in existing:
            skipped += 1
            continue
        accounts.append(account)
        existing.add(key)
        added += 1

    if added:
        _save()

    return _ok(
        added=added,
        skipped=skipped,
        invalid=invalid,
        count=len(accounts),
    )


ACTIONS = {
    "status": action_status,
    "diagnostics": action_diagnostics,
    "list": action_list,
    "save": action_save,
    "delete": action_delete,
    "import": action_import,
}


def handle(action, payload_json):
    with _LOCK:
        try:
            payload = json.loads(payload_json or "{}")
            if not isinstance(payload, dict):
                raise VaultError("请求格式错误")
            handler = ACTIONS.get(action)
            if handler is None:
                raise VaultError("未知操作")
            result = handler(payload)
        except VaultError as exc:
            _diag(f"{action}: {exc}")
            result = _err(str(exc))
        except Exception:
            import traceback
            _diag(f"{action}: unexpected error\n{traceback.format_exc()}")
            traceback.print_exc()
            result = _err("操作失败，请重试")
        return json.dumps(result, ensure_ascii=False, separators=(",", ":"))
