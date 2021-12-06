export ORIGINAL_PATH=`pwd`

# check if we have builtin
if [ ! -d "builtin" ]; then
    mkdir builtin
fi
cd builtin

# builtin panels
if [ ! -d "console" ]; then
    git clone git@gitee.com:cxx001/console.git
fi

if [ ! -d "ipc-debugger" ]; then
    git clone git@gitee.com:cxx001/ipc-debugger.git
fi

if [ ! -d "package-manager" ]; then
    git clone git@gitee.com:cxx001/package-manager.git
fi

if [ ! -d "tester" ]; then
    git clone git@gitee.com:cxx001/tester.git
fi

# builtin widgets
if [ ! -d "ui-kit" ]; then
    git clone git@gitee.com:cxx001/ui-kit.git
fi

if [ ! -d "pixi-grid" ]; then
    git clone git@gitee.com:cxx001/pixi-grid.git
fi

cd ${ORIGINAL_PATH}
