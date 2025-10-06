let wasmModule = null;
let wasmInstance = null;
let wasmMemory = null;

function log(message) {
    console.log(message);
}

function setStatus(message) {
    console.log(message);
}

async function loadWasm() {
    try {
        setStatus('Loading WASM...');
        const wasmBytes = await fetch('./night.wasm').then(r => r.arrayBuffer());
        const wasmModule = await WebAssembly.compile(wasmBytes);

        wasmMemory = new WebAssembly.Memory({ initial: 256, maximum: 256 });

        const imports = {
            env: {
                memory: wasmMemory,
                table: new WebAssembly.Table({ initial: 14, maximum: 14, element: 'anyfunc' }),
                DYNAMICTOP_PTR: new WebAssembly.Global({ value: 'i32', mutable: false }, 65536),
                STACKTOP: new WebAssembly.Global({ value: 'i32', mutable: false }, 16384),
                STACK_MAX: new WebAssembly.Global({ value: 'i32', mutable: false }, 5242880),
                memoryBase: new WebAssembly.Global({ value: 'i32', mutable: false }, 1024),
                tableBase: new WebAssembly.Global({ value: 'i32', mutable: false }, 0),
                abort: () => log('Mining operation aborted'),
                enlargeMemory: () => {
                    try {
                        wasmMemory.grow(64);
                        return 1;
                    } catch (e) {
                        return 0;
                    }
                },
                getTotalMemory: () => wasmMemory.buffer.byteLength,
                abortOnCannotGrowMemory: () => { throw new Error('Cannot grow memory'); },
                _gmtime: () => 0,
                ___lock: () => { },
                ___syscall6: () => 0,
                ___setErrNo: () => { },
                ___unlock: () => { },
                _ftime: () => 0,
                _emscripten_memcpy_big: (dest, src, size) => dest,
                ___syscall54: () => 0,
                ___syscall140: () => 0,
                ___syscall20: () => 0,
                ___assert_fail: () => { },
                ___syscall146: () => 0
            }
        };

        const wasmInstance = await WebAssembly.instantiate(wasmModule, imports);
        setStatus('WASM loaded successfully!');
        return { module: wasmModule, instance: wasmInstance };
    } catch (error) {
        setStatus('Error loading WASM: ' + error.message);
        throw error;
    }
}

async function runMining() {
    try {
        if (!wasmInstance) {
            const wasmData = await loadWasm();
            wasmModule = wasmData.module;
            wasmInstance = wasmData.instance;
        }

        const exports = wasmInstance.exports;
        log('Exports: ' + Object.keys(exports).join(', '));

        if (exports.establishStackSpace) exports.establishStackSpace();
        if (exports.runPostSets) exports.runPostSets();

        const testInput = new Uint8Array(32).fill(0);
        const inputPtr = exports._malloc ? exports._malloc(32) : 1024;
        const outputPtr = exports._malloc ? exports._malloc(32) : 2048;

        const memory = new Uint8Array(wasmMemory.buffer);
        memory.set(testInput, inputPtr);

        if (exports._cryptonight_create) exports._cryptonight_create();
        if (exports._cryptonight_hash) {
            exports._cryptonight_hash(inputPtr, outputPtr, 32, 0);
            const output = memory.slice(outputPtr, outputPtr + 32);
            log('Hash: ' + Array.from(output).map(b => b.toString(16).padStart(2, '0')).join(''));
        }
        if (exports._cryptonight_destroy) exports._cryptonight_destroy();

        if (exports._free) {
            exports._free(inputPtr);
            exports._free(outputPtr);
        }

        setStatus('Done');

    } catch (error) {
        log('Error: ' + error.message);
        throw error;
    }
}

window.addEventListener('load', async () => {
    try {
        await loadWasm();
    } catch (error) {
        console.error('Failed to load WASM:', error);
    }
});