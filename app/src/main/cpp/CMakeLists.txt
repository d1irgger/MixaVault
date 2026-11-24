cmake_minimum_required(VERSION 3.22.1)

project(needlejni CXX)

add_library(needlejni SHARED needle_jni.cpp)

target_compile_features(needlejni PRIVATE cxx_std_17)
target_include_directories(needlejni PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/needle/android-arm64
)

find_library(log-lib log)

if(ANDROID_ABI STREQUAL "arm64-v8a")
    target_compile_definitions(needlejni PRIVATE NEEDLE_AVAILABLE=1)
    target_link_libraries(needlejni PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/needle/android-arm64/libneedle.a
        ${log-lib}
        android
    )
else()
    target_compile_definitions(needlejni PRIVATE NEEDLE_AVAILABLE=0)
    target_link_libraries(needlejni PRIVATE ${log-lib})
endif()
