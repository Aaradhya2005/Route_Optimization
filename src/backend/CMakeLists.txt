cmake_minimum_required(VERSION 3.10)
project(RouteOptimization)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find required packages
find_package(nlohmann_json REQUIRED)

# Create shared library
add_library(route_optimization SHARED
    src/dijkstra.cpp
)

# Link libraries
target_link_libraries(route_optimization
    PRIVATE nlohmann_json::nlohmann_json
)

# Set output directory
set_target_properties(route_optimization PROPERTIES
    LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib
) 