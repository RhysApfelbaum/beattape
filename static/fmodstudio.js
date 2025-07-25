var FMODModule = (function () {
    var _scriptDir =
        typeof document !== 'undefined' && document.currentScript
            ? document.currentScript.src
            : undefined;
    if (typeof __filename !== 'undefined')
        _scriptDir = _scriptDir || __filename;
    return function (FMODModule) {
        FMODModule = FMODModule || {};

        var Module = typeof FMODModule !== 'undefined' ? FMODModule : {};
        var readyPromiseResolve, readyPromiseReject;
        Module['ready'] = new Promise(function (resolve, reject) {
            readyPromiseResolve = resolve;
            readyPromiseReject = reject;
        });
        var moduleOverrides = {};
        var key;
        for (key in Module) {
            if (Module.hasOwnProperty(key)) {
                moduleOverrides[key] = Module[key];
            }
        }
        var arguments_ = [];
        var thisProgram = './this.program';
        var quit_ = function (status, toThrow) {
            throw toThrow;
        };
        var ENVIRONMENT_IS_WEB = false;
        var ENVIRONMENT_IS_WORKER = false;
        var ENVIRONMENT_IS_NODE = false;
        var ENVIRONMENT_IS_SHELL = false;
        ENVIRONMENT_IS_WEB = typeof window === 'object';
        ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
        ENVIRONMENT_IS_NODE =
            typeof process === 'object' &&
            typeof process.versions === 'object' &&
            typeof process.versions.node === 'string';
        ENVIRONMENT_IS_SHELL =
            !ENVIRONMENT_IS_WEB &&
            !ENVIRONMENT_IS_NODE &&
            !ENVIRONMENT_IS_WORKER;
        var scriptDirectory = '';
        function locateFile(path) {
            if (Module['locateFile']) {
                return Module['locateFile'](path, scriptDirectory);
            }
            return scriptDirectory + path;
        }
        var read_, readAsync, readBinary, setWindowTitle;
        var nodeFS;
        var nodePath;
        if (ENVIRONMENT_IS_NODE) {
            if (ENVIRONMENT_IS_WORKER) {
                scriptDirectory =
                    require('path').dirname(scriptDirectory) + '/';
            } else {
                scriptDirectory = __dirname + '/';
            }
            read_ = function shell_read(filename, binary) {
                if (!nodeFS) nodeFS = require('fs');
                if (!nodePath) nodePath = require('path');
                filename = nodePath['normalize'](filename);
                return nodeFS['readFileSync'](filename, binary ? null : 'utf8');
            };
            readBinary = function readBinary(filename) {
                var ret = read_(filename, true);
                if (!ret.buffer) {
                    ret = new Uint8Array(ret);
                }
                assert(ret.buffer);
                return ret;
            };
            if (process['argv'].length > 1) {
                thisProgram = process['argv'][1].replace(/\\/g, '/');
            }
            arguments_ = process['argv'].slice(2);
            process['on']('uncaughtException', function (ex) {
                if (!(ex instanceof ExitStatus)) {
                    throw ex;
                }
            });
            process['on']('unhandledRejection', abort);
            quit_ = function (status) {
                process['exit'](status);
            };
            Module['inspect'] = function () {
                return '[Emscripten Module object]';
            };
        } else if (ENVIRONMENT_IS_SHELL) {
            if (typeof read != 'undefined') {
                read_ = function shell_read(f) {
                    return read(f);
                };
            }
            readBinary = function readBinary(f) {
                var data;
                if (typeof readbuffer === 'function') {
                    return new Uint8Array(readbuffer(f));
                }
                data = read(f, 'binary');
                assert(typeof data === 'object');
                return data;
            };
            if (typeof scriptArgs != 'undefined') {
                arguments_ = scriptArgs;
            } else if (typeof arguments != 'undefined') {
                arguments_ = arguments;
            }
            if (typeof quit === 'function') {
                quit_ = function (status) {
                    quit(status);
                };
            }
            if (typeof print !== 'undefined') {
                if (typeof console === 'undefined') console = {};
                console.log = print;
                console.warn = console.error =
                    typeof printErr !== 'undefined' ? printErr : print;
            }
        } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
            if (ENVIRONMENT_IS_WORKER) {
                scriptDirectory = self.location.href;
            } else if (
                typeof document !== 'undefined' &&
                document.currentScript
            ) {
                scriptDirectory = document.currentScript.src;
            }
            if (_scriptDir) {
                scriptDirectory = _scriptDir;
            }
            if (scriptDirectory.indexOf('blob:') !== 0) {
                scriptDirectory = scriptDirectory.substr(
                    0,
                    scriptDirectory.lastIndexOf('/') + 1,
                );
            } else {
                scriptDirectory = '';
            }
            {
                read_ = function (url) {
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', url, false);
                    xhr.send(null);
                    return xhr.responseText;
                };
                if (ENVIRONMENT_IS_WORKER) {
                    readBinary = function (url) {
                        var xhr = new XMLHttpRequest();
                        xhr.open('GET', url, false);
                        xhr.responseType = 'arraybuffer';
                        xhr.send(null);
                        return new Uint8Array(xhr.response);
                    };
                }
                readAsync = function (url, onload, onerror) {
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', url, true);
                    xhr.responseType = 'arraybuffer';
                    xhr.onload = function () {
                        if (
                            xhr.status == 200 ||
                            (xhr.status == 0 && xhr.response)
                        ) {
                            onload(xhr.response);
                            return;
                        }
                        onerror();
                    };
                    xhr.onerror = onerror;
                    xhr.send(null);
                };
            }
            setWindowTitle = function (title) {
                document.title = title;
            };
        } else {
        }
        var out = Module['print'] || console.log.bind(console);
        var err = Module['printErr'] || console.warn.bind(console);
        for (key in moduleOverrides) {
            if (moduleOverrides.hasOwnProperty(key)) {
                Module[key] = moduleOverrides[key];
            }
        }
        moduleOverrides = null;
        if (Module['arguments']) arguments_ = Module['arguments'];
        if (Module['thisProgram']) thisProgram = Module['thisProgram'];
        if (Module['quit']) quit_ = Module['quit'];
        var STACK_ALIGN = 16;
        function alignMemory(size, factor) {
            if (!factor) factor = STACK_ALIGN;
            return Math.ceil(size / factor) * factor;
        }
        function warnOnce(text) {
            if (!warnOnce.shown) warnOnce.shown = {};
            if (!warnOnce.shown[text]) {
                warnOnce.shown[text] = 1;
                err(text);
            }
        }
        var tempRet0 = 0;
        var setTempRet0 = function (value) {
            tempRet0 = value;
        };
        var wasmBinary;
        if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];
        var noExitRuntime = Module['noExitRuntime'] || true;
        if (typeof WebAssembly !== 'object') {
            abort('no native wasm support detected');
        }
        function setValue(ptr, value, type, noSafe) {
            type = type || 'i8';
            if (type.charAt(type.length - 1) === '*') type = 'i32';
            switch (type) {
                case 'i1':
                    HEAP8[ptr >> 0] = value;
                    break;
                case 'i8':
                    HEAP8[ptr >> 0] = value;
                    break;
                case 'i16':
                    HEAP16[ptr >> 1] = value;
                    break;
                case 'i32':
                    HEAP32[ptr >> 2] = value;
                    break;
                case 'i64':
                    ((tempI64 = [
                        value >>> 0,
                        ((tempDouble = value),
                        +Math.abs(tempDouble) >= 1
                            ? tempDouble > 0
                                ? (Math.min(
                                      +Math.floor(tempDouble / 4294967296),
                                      4294967295,
                                  ) |
                                      0) >>>
                                  0
                                : ~~+Math.ceil(
                                      (tempDouble - +(~~tempDouble >>> 0)) /
                                          4294967296,
                                  ) >>> 0
                            : 0),
                    ]),
                        (HEAP32[ptr >> 2] = tempI64[0]),
                        (HEAP32[(ptr + 4) >> 2] = tempI64[1]));
                    break;
                case 'float':
                    HEAPF32[ptr >> 2] = value;
                    break;
                case 'double':
                    HEAPF64[ptr >> 3] = value;
                    break;
                default:
                    abort('invalid type for setValue: ' + type);
            }
        }
        function getValue(ptr, type, noSafe) {
            type = type || 'i8';
            if (type.charAt(type.length - 1) === '*') type = 'i32';
            switch (type) {
                case 'i1':
                    return HEAP8[ptr >> 0];
                case 'i8':
                    return HEAP8[ptr >> 0];
                case 'i16':
                    return HEAP16[ptr >> 1];
                case 'i32':
                    return HEAP32[ptr >> 2];
                case 'i64':
                    return HEAP32[ptr >> 2];
                case 'float':
                    return HEAPF32[ptr >> 2];
                case 'double':
                    return HEAPF64[ptr >> 3];
                default:
                    abort('invalid type for getValue: ' + type);
            }
            return null;
        }
        var wasmMemory;
        var ABORT = false;
        var EXITSTATUS;
        function assert(condition, text) {
            if (!condition) {
                abort('Assertion failed: ' + text);
            }
        }
        function getCFunc(ident) {
            var func = Module['_' + ident];
            assert(
                func,
                'Cannot call unknown function ' +
                    ident +
                    ', make sure it is exported',
            );
            return func;
        }
        function ccall(ident, returnType, argTypes, args, opts) {
            var toC = {
                string: function (str) {
                    var ret = 0;
                    if (str !== null && str !== undefined && str !== 0) {
                        var len = (str.length << 2) + 1;
                        ret = stackAlloc(len);
                        stringToUTF8(str, ret, len);
                    }
                    return ret;
                },
                array: function (arr) {
                    var ret = stackAlloc(arr.length);
                    writeArrayToMemory(arr, ret);
                    return ret;
                },
            };
            function convertReturnValue(ret) {
                if (returnType === 'string') return UTF8ToString(ret);
                if (returnType === 'boolean') return Boolean(ret);
                return ret;
            }
            var func = getCFunc(ident);
            var cArgs = [];
            var stack = 0;
            if (args) {
                for (var i = 0; i < args.length; i++) {
                    var converter = toC[argTypes[i]];
                    if (converter) {
                        if (stack === 0) stack = stackSave();
                        cArgs[i] = converter(args[i]);
                    } else {
                        cArgs[i] = args[i];
                    }
                }
            }
            var ret = func.apply(null, cArgs);
            var asyncMode = opts && opts.async;
            var runningAsync =
                typeof Asyncify === 'object' && Asyncify.currData;
            var prevRunningAsync =
                typeof Asyncify === 'object' &&
                Asyncify.asyncFinalizers.length > 0;
            if (runningAsync && !prevRunningAsync) {
                return new Promise(function (resolve) {
                    Asyncify.asyncFinalizers.push(function (ret) {
                        if (stack !== 0) stackRestore(stack);
                        resolve(convertReturnValue(ret));
                    });
                });
            }
            ret = convertReturnValue(ret);
            if (stack !== 0) stackRestore(stack);
            if (opts && opts.async) return Promise.resolve(ret);
            return ret;
        }
        function cwrap(ident, returnType, argTypes, opts) {
            argTypes = argTypes || [];
            var numericArgs = argTypes.every(function (type) {
                return type === 'number';
            });
            var numericRet = returnType !== 'string';
            if (numericRet && numericArgs && !opts) {
                return getCFunc(ident);
            }
            return function () {
                return ccall(ident, returnType, argTypes, arguments, opts);
            };
        }
        var UTF8Decoder =
            typeof TextDecoder !== 'undefined'
                ? new TextDecoder('utf8')
                : undefined;
        function UTF8ArrayToString(heap, idx, maxBytesToRead) {
            var endIdx = idx + maxBytesToRead;
            var endPtr = idx;
            while (heap[endPtr] && !(endPtr >= endIdx)) ++endPtr;
            if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
                return UTF8Decoder.decode(heap.subarray(idx, endPtr));
            } else {
                var str = '';
                while (idx < endPtr) {
                    var u0 = heap[idx++];
                    if (!(u0 & 128)) {
                        str += String.fromCharCode(u0);
                        continue;
                    }
                    var u1 = heap[idx++] & 63;
                    if ((u0 & 224) == 192) {
                        str += String.fromCharCode(((u0 & 31) << 6) | u1);
                        continue;
                    }
                    var u2 = heap[idx++] & 63;
                    if ((u0 & 240) == 224) {
                        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
                    } else {
                        u0 =
                            ((u0 & 7) << 18) |
                            (u1 << 12) |
                            (u2 << 6) |
                            (heap[idx++] & 63);
                    }
                    if (u0 < 65536) {
                        str += String.fromCharCode(u0);
                    } else {
                        var ch = u0 - 65536;
                        str += String.fromCharCode(
                            55296 | (ch >> 10),
                            56320 | (ch & 1023),
                        );
                    }
                }
            }
            return str;
        }
        function UTF8ToString(ptr, maxBytesToRead) {
            return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
        }
        function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
            if (!(maxBytesToWrite > 0)) return 0;
            var startIdx = outIdx;
            var endIdx = outIdx + maxBytesToWrite - 1;
            for (var i = 0; i < str.length; ++i) {
                var u = str.charCodeAt(i);
                if (u >= 55296 && u <= 57343) {
                    var u1 = str.charCodeAt(++i);
                    u = (65536 + ((u & 1023) << 10)) | (u1 & 1023);
                }
                if (u <= 127) {
                    if (outIdx >= endIdx) break;
                    heap[outIdx++] = u;
                } else if (u <= 2047) {
                    if (outIdx + 1 >= endIdx) break;
                    heap[outIdx++] = 192 | (u >> 6);
                    heap[outIdx++] = 128 | (u & 63);
                } else if (u <= 65535) {
                    if (outIdx + 2 >= endIdx) break;
                    heap[outIdx++] = 224 | (u >> 12);
                    heap[outIdx++] = 128 | ((u >> 6) & 63);
                    heap[outIdx++] = 128 | (u & 63);
                } else {
                    if (outIdx + 3 >= endIdx) break;
                    heap[outIdx++] = 240 | (u >> 18);
                    heap[outIdx++] = 128 | ((u >> 12) & 63);
                    heap[outIdx++] = 128 | ((u >> 6) & 63);
                    heap[outIdx++] = 128 | (u & 63);
                }
            }
            heap[outIdx] = 0;
            return outIdx - startIdx;
        }
        function stringToUTF8(str, outPtr, maxBytesToWrite) {
            return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
        }
        function lengthBytesUTF8(str) {
            var len = 0;
            for (var i = 0; i < str.length; ++i) {
                var u = str.charCodeAt(i);
                if (u >= 55296 && u <= 57343)
                    u =
                        (65536 + ((u & 1023) << 10)) |
                        (str.charCodeAt(++i) & 1023);
                if (u <= 127) ++len;
                else if (u <= 2047) len += 2;
                else if (u <= 65535) len += 3;
                else len += 4;
            }
            return len;
        }
        var UTF16Decoder =
            typeof TextDecoder !== 'undefined'
                ? new TextDecoder('utf-16le')
                : undefined;
        function UTF16ToString(ptr, maxBytesToRead) {
            var endPtr = ptr;
            var idx = endPtr >> 1;
            var maxIdx = idx + maxBytesToRead / 2;
            while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
            endPtr = idx << 1;
            if (endPtr - ptr > 32 && UTF16Decoder) {
                return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
            } else {
                var str = '';
                for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
                    var codeUnit = HEAP16[(ptr + i * 2) >> 1];
                    if (codeUnit == 0) break;
                    str += String.fromCharCode(codeUnit);
                }
                return str;
            }
        }
        function stringToUTF16(str, outPtr, maxBytesToWrite) {
            if (maxBytesToWrite === undefined) {
                maxBytesToWrite = 2147483647;
            }
            if (maxBytesToWrite < 2) return 0;
            maxBytesToWrite -= 2;
            var startPtr = outPtr;
            var numCharsToWrite =
                maxBytesToWrite < str.length * 2
                    ? maxBytesToWrite / 2
                    : str.length;
            for (var i = 0; i < numCharsToWrite; ++i) {
                var codeUnit = str.charCodeAt(i);
                HEAP16[outPtr >> 1] = codeUnit;
                outPtr += 2;
            }
            HEAP16[outPtr >> 1] = 0;
            return outPtr - startPtr;
        }
        function lengthBytesUTF16(str) {
            return str.length * 2;
        }
        function UTF32ToString(ptr, maxBytesToRead) {
            var i = 0;
            var str = '';
            while (!(i >= maxBytesToRead / 4)) {
                var utf32 = HEAP32[(ptr + i * 4) >> 2];
                if (utf32 == 0) break;
                ++i;
                if (utf32 >= 65536) {
                    var ch = utf32 - 65536;
                    str += String.fromCharCode(
                        55296 | (ch >> 10),
                        56320 | (ch & 1023),
                    );
                } else {
                    str += String.fromCharCode(utf32);
                }
            }
            return str;
        }
        function stringToUTF32(str, outPtr, maxBytesToWrite) {
            if (maxBytesToWrite === undefined) {
                maxBytesToWrite = 2147483647;
            }
            if (maxBytesToWrite < 4) return 0;
            var startPtr = outPtr;
            var endPtr = startPtr + maxBytesToWrite - 4;
            for (var i = 0; i < str.length; ++i) {
                var codeUnit = str.charCodeAt(i);
                if (codeUnit >= 55296 && codeUnit <= 57343) {
                    var trailSurrogate = str.charCodeAt(++i);
                    codeUnit =
                        (65536 + ((codeUnit & 1023) << 10)) |
                        (trailSurrogate & 1023);
                }
                HEAP32[outPtr >> 2] = codeUnit;
                outPtr += 4;
                if (outPtr + 4 > endPtr) break;
            }
            HEAP32[outPtr >> 2] = 0;
            return outPtr - startPtr;
        }
        function lengthBytesUTF32(str) {
            var len = 0;
            for (var i = 0; i < str.length; ++i) {
                var codeUnit = str.charCodeAt(i);
                if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
                len += 4;
            }
            return len;
        }
        function writeArrayToMemory(array, buffer) {
            HEAP8.set(array, buffer);
        }
        function alignUp(x, multiple) {
            if (x % multiple > 0) {
                x += multiple - (x % multiple);
            }
            return x;
        }
        var buffer,
            HEAP8,
            HEAPU8,
            HEAP16,
            HEAPU16,
            HEAP32,
            HEAPU32,
            HEAPF32,
            HEAPF64;
        function updateGlobalBufferAndViews(buf) {
            buffer = buf;
            Module['HEAP8'] = HEAP8 = new Int8Array(buf);
            Module['HEAP16'] = HEAP16 = new Int16Array(buf);
            Module['HEAP32'] = HEAP32 = new Int32Array(buf);
            Module['HEAPU8'] = HEAPU8 = new Uint8Array(buf);
            Module['HEAPU16'] = HEAPU16 = new Uint16Array(buf);
            Module['HEAPU32'] = HEAPU32 = new Uint32Array(buf);
            Module['HEAPF32'] = HEAPF32 = new Float32Array(buf);
            Module['HEAPF64'] = HEAPF64 = new Float64Array(buf);
        }
        var INITIAL_MEMORY = Module['INITIAL_MEMORY'] || 16777216;
        var wasmTable;
        var __ATPRERUN__ = [];
        var __ATINIT__ = [];
        var __ATPOSTRUN__ = [];
        var runtimeInitialized = false;
        var runtimeExited = false;
        function preRun() {
            if (Module['preRun']) {
                if (typeof Module['preRun'] == 'function')
                    Module['preRun'] = [Module['preRun']];
                while (Module['preRun'].length) {
                    addOnPreRun(Module['preRun'].shift());
                }
            }
            callRuntimeCallbacks(__ATPRERUN__);
        }
        function initRuntime() {
            runtimeInitialized = true;
            if (!Module['noFSInit'] && !FS.init.initialized) FS.init();
            TTY.init();
            callRuntimeCallbacks(__ATINIT__);
        }
        function exitRuntime() {
            runtimeExited = true;
        }
        function postRun() {
            if (Module['postRun']) {
                if (typeof Module['postRun'] == 'function')
                    Module['postRun'] = [Module['postRun']];
                while (Module['postRun'].length) {
                    addOnPostRun(Module['postRun'].shift());
                }
            }
            callRuntimeCallbacks(__ATPOSTRUN__);
        }
        function addOnPreRun(cb) {
            __ATPRERUN__.unshift(cb);
        }
        function addOnInit(cb) {
            __ATINIT__.unshift(cb);
        }
        function addOnPostRun(cb) {
            __ATPOSTRUN__.unshift(cb);
        }
        var runDependencies = 0;
        var runDependencyWatcher = null;
        var dependenciesFulfilled = null;
        function getUniqueRunDependency(id) {
            return id;
        }
        function addRunDependency(id) {
            runDependencies++;
            if (Module['monitorRunDependencies']) {
                Module['monitorRunDependencies'](runDependencies);
            }
        }
        function removeRunDependency(id) {
            runDependencies--;
            if (Module['monitorRunDependencies']) {
                Module['monitorRunDependencies'](runDependencies);
            }
            if (runDependencies == 0) {
                if (runDependencyWatcher !== null) {
                    clearInterval(runDependencyWatcher);
                    runDependencyWatcher = null;
                }
                if (dependenciesFulfilled) {
                    var callback = dependenciesFulfilled;
                    dependenciesFulfilled = null;
                    callback();
                }
            }
        }
        Module['preloadedImages'] = {};
        Module['preloadedAudios'] = {};
        function abort(what) {
            if (Module['onAbort']) {
                Module['onAbort'](what);
            }
            what += '';
            err(what);
            ABORT = true;
            EXITSTATUS = 1;
            what =
                'abort(' +
                what +
                '). Build with -s ASSERTIONS=1 for more info.';
            var e = new WebAssembly.RuntimeError(what);
            readyPromiseReject(e);
            throw e;
        }
        var dataURIPrefix = 'data:application/octet-stream;base64,';
        function isDataURI(filename) {
            return filename.startsWith(dataURIPrefix);
        }
        function isFileURI(filename) {
            return filename.startsWith('file://');
        }
        var wasmBinaryFile = 'fmodstudio.wasm';
        if (!isDataURI(wasmBinaryFile)) {
            wasmBinaryFile = locateFile(wasmBinaryFile);
        }
        function getBinary(file) {
            try {
                if (file == wasmBinaryFile && wasmBinary) {
                    return new Uint8Array(wasmBinary);
                }
                if (readBinary) {
                    return readBinary(file);
                } else {
                    throw 'both async and sync fetching of the wasm failed';
                }
            } catch (err) {
                abort(err);
            }
        }
        function getBinaryPromise() {
            if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
                if (typeof fetch === 'function' && !isFileURI(wasmBinaryFile)) {
                    return fetch(wasmBinaryFile, { credentials: 'same-origin' })
                        .then(function (response) {
                            if (!response['ok']) {
                                throw (
                                    "failed to load wasm binary file at '" +
                                    wasmBinaryFile +
                                    "'"
                                );
                            }
                            return response['arrayBuffer']();
                        })
                        .catch(function () {
                            return getBinary(wasmBinaryFile);
                        });
                } else {
                    if (readAsync) {
                        return new Promise(function (resolve, reject) {
                            readAsync(
                                wasmBinaryFile,
                                function (response) {
                                    resolve(new Uint8Array(response));
                                },
                                reject,
                            );
                        });
                    }
                }
            }
            return Promise.resolve().then(function () {
                return getBinary(wasmBinaryFile);
            });
        }
        function createWasm() {
            var info = { a: asmLibraryArg };
            function receiveInstance(instance, module) {
                var exports = instance.exports;
                exports = Asyncify.instrumentWasmExports(exports);
                Module['asm'] = exports;
                wasmMemory = Module['asm']['P'];
                updateGlobalBufferAndViews(wasmMemory.buffer);
                wasmTable = Module['asm']['R'];
                addOnInit(Module['asm']['Q']);
                removeRunDependency('wasm-instantiate');
            }
            addRunDependency('wasm-instantiate');
            function receiveInstantiationResult(result) {
                receiveInstance(result['instance']);
            }
            function instantiateArrayBuffer(receiver) {
                return getBinaryPromise()
                    .then(function (binary) {
                        var result = WebAssembly.instantiate(binary, info);
                        return result;
                    })
                    .then(receiver, function (reason) {
                        err('failed to asynchronously prepare wasm: ' + reason);
                        abort(reason);
                    });
            }
            function instantiateAsync() {
                if (
                    !wasmBinary &&
                    typeof WebAssembly.instantiateStreaming === 'function' &&
                    !isDataURI(wasmBinaryFile) &&
                    !isFileURI(wasmBinaryFile) &&
                    typeof fetch === 'function'
                ) {
                    return fetch(wasmBinaryFile, {
                        credentials: 'same-origin',
                    }).then(function (response) {
                        var result = WebAssembly.instantiateStreaming(
                            response,
                            info,
                        );
                        return result.then(
                            receiveInstantiationResult,
                            function (reason) {
                                err('wasm streaming compile failed: ' + reason);
                                err(
                                    'falling back to ArrayBuffer instantiation',
                                );
                                return instantiateArrayBuffer(
                                    receiveInstantiationResult,
                                );
                            },
                        );
                    });
                } else {
                    return instantiateArrayBuffer(receiveInstantiationResult);
                }
            }
            if (Module['instantiateWasm']) {
                try {
                    var exports = Module['instantiateWasm'](
                        info,
                        receiveInstance,
                    );
                    exports = Asyncify.instrumentWasmExports(exports);
                    return exports;
                } catch (e) {
                    err(
                        'Module.instantiateWasm callback failed with error: ' +
                            e,
                    );
                    return false;
                }
            }
            instantiateAsync().catch(readyPromiseReject);
            return {};
        }
        var tempDouble;
        var tempI64;
        var ASM_CONSTS = {
            282452: function () {
                var AudioContext =
                    window.AudioContext || window.webkitAudioContext;
                var contextForCheck = new AudioContext();
                if (!contextForCheck) {
                    return 0;
                }
                var retValue = 0;
                if (self.AudioWorkletNode) {
                    if (contextForCheck.audioWorklet.addModule) {
                        retValue = 1;
                    }
                }
                contextForCheck.close();
                return retValue;
            },
            282756: function () {
                var AudioContext =
                    window.AudioContext || window.webkitAudioContext;
                var infocontext = new AudioContext();
                if (!infocontext) {
                    return 0;
                }
                var inforate = infocontext.sampleRate;
                infocontext.close();
                return inforate;
            },
            282976: function () {
                Module.mInputRegistered = false;
            },
            283013: function () {
                var AudioContext =
                    window.AudioContext || window.webkitAudioContext;
                Module.context = new AudioContext();
                if (!Module.context) {
                    return 0;
                }
                Module.FMOD_JS_MixFunction = Module['cwrap'](
                    'FMOD_JS_MixFunction',
                    'void',
                    ['number'],
                );
                return Module.context.sampleRate;
            },
            283281: function ($0, $1) {
                Module._as_script_node = Module.context.createScriptProcessor(
                    $1,
                    0,
                    $0,
                );
                Module['OutputWebAudio_resumeAudio'] = function () {
                    if (Module.context && Module.mInputRegistered) {
                        console.log(
                            'Resetting audio driver based on user input.',
                        );
                        Module._as_script_node.connect(
                            Module.context.destination,
                        );
                        Module._as_script_node.onaudioprocess = function (
                            audioProcessingEvent,
                        ) {
                            Module._as_output_buffer =
                                audioProcessingEvent.outputBuffer;
                            Module.FMOD_JS_MixFunction(
                                Module._as_output_buffer.getChannelData(0)
                                    .length,
                            );
                        };
                        Module.context.resume();
                        window.removeEventListener(
                            'click',
                            Module.OutputWebAudio_resumeAudio,
                            false,
                        );
                        window.removeEventListener(
                            'touchend',
                            Module.OutputWebAudio_resumeAudio,
                            false,
                        );
                        Module.mInputRegistered = false;
                    }
                };
            },
            284021: function () {
                if (Module.mInputRegistered) {
                    Module.mInputRegistered = false;
                    window.removeEventListener(
                        'click',
                        Module['OutputWebAudio_resumeAudio'],
                        false,
                    );
                    window.removeEventListener(
                        'touchend',
                        Module['OutputWebAudio_resumeAudio'],
                        false,
                    );
                }
            },
            284258: function () {
                window.addEventListener(
                    'touchend',
                    Module['OutputWebAudio_resumeAudio'],
                    false,
                );
                window.addEventListener(
                    'click',
                    Module['OutputWebAudio_resumeAudio'],
                    false,
                );
                Module.mInputRegistered = true;
            },
            284455: function () {
                Module._as_script_node.disconnect(Module.context.destination);
            },
            284522: function ($0, $1, $2, $3) {
                var data = HEAPF32.subarray($0 / 4, $0 / 4 + $2 * $3);
                for (var channel = 0; channel < $3; channel++) {
                    var outputData =
                        Module._as_output_buffer.getChannelData(channel);
                    for (var sample = 0; sample < $2; sample++) {
                        outputData[sample + $1] = data[sample * $3 + channel];
                    }
                }
            },
            284804: function () {
                Module.context.suspend();
            },
            284834: function () {
                Module.context.resume();
            },
            284863: function () {
                var AudioContext =
                    window.AudioContext || window.webkitAudioContext;
                var infocontext = new AudioContext();
                if (!infocontext) {
                    return 0;
                }
                var inforate = infocontext.sampleRate;
                infocontext.close();
                return inforate;
            },
            285083: function () {
                Module.mWorkletNode = null;
                Module.mModulePolling = false;
                Module.mModuleLoading = false;
                Module.mStartInterval = null;
                Module.mStopInterval = null;
                Module.mSuspendInterval = null;
                Module.mResumeInterval = null;
                Module.mWorkletNodeConnected = false;
                Module.mInputRegistered = false;
                var AudioContext =
                    window.AudioContext || window.webkitAudioContext;
                Module.mContext = new AudioContext();
                if (!Module.mContext) {
                    return 0;
                }
                Module.mContext.destination.channelCount =
                    Module.mContext.destination.maxChannelCount;
                return Module.mContext.destination.maxChannelCount;
            },
            285653: function ($0) {
                const initAddModuleRef = $0;
                if (!initAddModuleRef) {
                    Module.mAddModuleRef = 0;
                }
                if (!self.AudioWorkletNode) {
                    return -1;
                }
                if (!Module.mContext.audioWorklet.addModule) {
                    return -2;
                }
                Module.FMOD_JS_MixerSlowpathFunction = Module['cwrap'](
                    'FMOD_JS_MixerSlowpathFunction',
                    'void',
                    [],
                );
                Module.FMOD_JS_MixerFastpathFunction = Module['cwrap'](
                    'FMOD_JS_MixerFastpathFunction',
                    'void',
                    ['number'],
                );
                return Module.mContext.sampleRate;
            },
            286087: function ($0, $1) {
                Module.mSpeakerChannelCount = $0;
                const bufferLength = $1;
                Module.mUrl = null;
                Module.mOutputData = null;
                Module.mSharedArrayBuffers = false;
                if (self.SharedArrayBuffer) {
                    if (self.crossOriginIsolated) {
                        Module.mSharedArrayBuffers = true;
                    }
                }
                if (!Module.mSharedArrayBuffers) {
                    const slowCodePath = new Blob(
                        [
                            'class AudioProcessor extends AudioWorkletProcessor',
                            '{',
                            'constructor(options)',
                            '{',
                            'super();',
                            'this.payload = [null, null];',
                            'this.bufferFlag = 0;',
                            'this.dataFlag = 0;',
                            'this.bufferIndex = 0;',
                            'this.bufferSize = 0;',
                            'this.channelCount = options.outputChannelCount;',
                            'this.port.onmessage = (event) => {',
                            'const { data } = event;',
                            'if (data)',
                            '{',
                            'this.payload[this.dataFlag] = new Float32Array(data);',
                            'this.bufferSize = data.length / this.channelCount;',
                            '}',
                            'else',
                            '{',
                            'this.payload[this.dataFlag] = null;',
                            '}',
                            'this.dataFlag ^= 1;',
                            '};',
                            '}',
                            'process(inputs, outputs, parameters)',
                            '{',
                            'const output = outputs[0];',
                            'if (this.payload[this.bufferFlag]) {',
                            'if (this.bufferIndex === 0) {',
                            'this.port.postMessage(this.bufferSize);',
                            '}',
                            'const bufferSliceEnd = this.bufferSize / output[0].length;',
                            'const sliceOffset = output[0].length * this.bufferIndex;',
                            'for (let channel = 0; channel < output.length; ++channel) {',
                            'const outputChannel = output[channel];',
                            'const indexOffset = this.bufferSize * channel + sliceOffset;',
                            'outputChannel.set(new Float32Array(this.payload[this.bufferFlag].slice(0 + indexOffset, outputChannel.length + indexOffset)));',
                            '}',
                            'this.bufferIndex++;',
                            'if (this.bufferIndex === bufferSliceEnd) {',
                            'this.bufferIndex = 0;',
                            'this.bufferFlag ^= 1;',
                            '}',
                            '}',
                            'return true;',
                            '}',
                            '}',
                            "registerProcessor('audio-processor', AudioProcessor);",
                        ],
                        { type: 'application/javascript' },
                    );
                    Module.mUrl = URL.createObjectURL(slowCodePath);
                    Module.mOutputData = new Float32Array(
                        Module.mSpeakerChannelCount * bufferLength,
                    );
                } else {
                    const fastCodePath = new Blob(
                        [
                            'class AudioProcessor extends AudioWorkletProcessor',
                            '{',
                            'constructor(options)',
                            '{',
                            'super();',
                            'this.payload = null;',
                            'this.bufferFlag = 0;',
                            'this.bufferIndex = 0;',
                            'this.bufferSize = 0;',
                            'this.bufferOffset = 0;',
                            'this.channelCount = options.outputChannelCount;',
                            'this.port.onmessage = (event) => {',
                            'const { data } = event;',
                            'if (data)',
                            '{',
                            'this.payload = data;',
                            'this.bufferSize = this.payload.length / (this.channelCount * 2);',
                            'this.bufferOffset = this.payload.length / 2;',
                            '}',
                            'else',
                            '{',
                            'this.payload = null;',
                            '}',
                            '};',
                            '}',
                            'process(inputs, outputs, parameters)',
                            '{',
                            'const output = outputs[0];',
                            'if (this.payload) {',
                            'if (this.bufferIndex === 0) {',
                            'this.port.postMessage(this.bufferFlag ^ 1);',
                            '}',
                            'const bufferSliceEnd = this.bufferSize / output[0].length;',
                            'const sliceOffset = output[0].length * this.bufferIndex + this.bufferOffset * this.bufferFlag;',
                            'for (let channel = 0; channel < output.length; ++channel) {',
                            'const outputChannel = output[channel];',
                            'const indexOffset = this.bufferSize * channel + sliceOffset;',
                            'outputChannel.set(new Float32Array(this.payload.slice(0 + indexOffset, outputChannel.length + indexOffset)));',
                            '}',
                            'this.bufferIndex++;',
                            'if (this.bufferIndex === bufferSliceEnd) {',
                            'this.bufferIndex = 0;',
                            'this.bufferFlag ^= 1;',
                            '}',
                            '}',
                            'return true;',
                            '}',
                            '}',
                            "registerProcessor('audio-processor', AudioProcessor);",
                        ],
                        { type: 'application/javascript' },
                    );
                    Module.mUrl = URL.createObjectURL(fastCodePath);
                    Module.mOutputData = new Float32Array(
                        new SharedArrayBuffer(
                            Float32Array.BYTES_PER_ELEMENT *
                                Module.mSpeakerChannelCount *
                                bufferLength *
                                2,
                        ),
                    );
                }
                Module.mModulePolling = true;
                Module['waitForAudioWorklet'] = function (condition, callback) {
                    var myInterval = null;
                    if (condition()) {
                        myInterval = setInterval(function () {
                            if (!condition()) {
                                callback();
                                clearInterval(myInterval);
                            }
                        }, 50);
                    } else {
                        callback();
                        return null;
                    }
                    return myInterval;
                };
                Module['OutputAudioWorklet_resumeAudio'] = function () {
                    if (Module.mContext && Module.mInputRegistered) {
                        console.log(
                            'Resetting audio driver based on user input.',
                        );
                        Module.mContext.resume();
                        window.removeEventListener(
                            'click',
                            Module.OutputAudioWorklet_resumeAudio,
                            false,
                        );
                        window.removeEventListener(
                            'touchend',
                            Module.OutputAudioWorklet_resumeAudio,
                            false,
                        );
                        Module.mInputRegistered = false;
                        if (!Module.mModuleLoading) {
                            Module.mModuleLoading = true;
                            Module.mAddModuleRef++;
                            Module.mContext
                                .resume()
                                .then(function () {
                                    Module.mContext.audioWorklet
                                        .addModule(Module.mUrl)
                                        .then(function () {
                                            if (Module.mAddModuleRef === 1) {
                                                Module.mWorkletNode =
                                                    new AudioWorkletNode(
                                                        Module.mContext,
                                                        'audio-processor',
                                                        {
                                                            outputChannelCount:
                                                                [
                                                                    Module.mSpeakerChannelCount,
                                                                ],
                                                        },
                                                    );
                                                Module.mModulePolling = false;
                                                URL.revokeObjectURL(
                                                    Module.mUrl,
                                                );
                                                if (Module.mWorkletNode) {
                                                    Module.mWorkletNode.port.postMessage(
                                                        Module.mOutputData,
                                                    );
                                                    if (
                                                        Module.mSharedArrayBuffers
                                                    ) {
                                                        Module.mWorkletNode.port.onmessage =
                                                            function (event) {
                                                                Module.FMOD_JS_MixerFastpathFunction(
                                                                    event.data,
                                                                );
                                                            };
                                                    } else {
                                                        Module.mWorkletNode.port.onmessage =
                                                            function (event) {
                                                                Module.FMOD_JS_MixerSlowpathFunction();
                                                                Module.mWorkletNode.port.postMessage(
                                                                    Module.mOutputData,
                                                                );
                                                            };
                                                    }
                                                } else {
                                                    console.log(
                                                        'Error when creating AudioWorkletNode: Null object',
                                                    );
                                                }
                                            }
                                            Module.mAddModuleRef--;
                                        })
                                        .catch(function (err) {
                                            Module.mModulePolling = false;
                                            Module.mAddModuleRef--;
                                            console.log(
                                                'Error when opening audio processor ',
                                            );
                                            console.log(err);
                                        });
                                })
                                .catch(function (err) {
                                    Module.mModulePolling = false;
                                    Module.mAddModuleRef--;
                                    console.log('Error with mContext.resume()');
                                    console.log(err);
                                });
                        }
                    }
                };
                return Module.mSharedArrayBuffers;
            },
            291616: function () {
                window.addEventListener(
                    'touchend',
                    Module['OutputAudioWorklet_resumeAudio'],
                    false,
                );
                window.addEventListener(
                    'click',
                    Module['OutputAudioWorklet_resumeAudio'],
                    false,
                );
                Module.mInputRegistered = true;
            },
            291821: function () {
                if (Module.mStartInterval) {
                    clearInterval(Module.mStartInterval);
                }
                if (Module.mStopInterval) {
                    clearInterval(Module.mStopInterval);
                }
                if (Module.mSuspendInterval) {
                    clearInterval(Module.mSuspendInterval);
                }
                if (Module.mResumeInterval) {
                    clearInterval(Module.mResumeInterval);
                }
                if (Module.mWorkletNode) {
                    if (Module.mWorkletNodeConnected) {
                        Module.mWorkletNode.disconnect();
                    }
                }
                if (Module.mContext) {
                    Module.mContext.close();
                }
                if (Module.mInputRegistered) {
                    Module.mInputRegistered = false;
                    window.removeEventListener(
                        'click',
                        Module['OutputAudioWorklet_resumeAudio'],
                        false,
                    );
                    window.removeEventListener(
                        'touchend',
                        Module['OutputAudioWorklet_resumeAudio'],
                        false,
                    );
                }
            },
            292497: function () {
                Module.mStartInterval = Module['waitForAudioWorklet'](
                    function () {
                        return (
                            Module.mWorkletNode === null &&
                            Module.mModulePolling
                        );
                    },
                    function () {
                        if (Module.mWorkletNode) {
                            Module.mWorkletNode.connect(
                                Module.mContext.destination,
                            );
                            Module.mWorkletNodeConnected = true;
                        }
                    },
                );
            },
            292774: function () {
                Module.mStopInterval = Module['waitForAudioWorklet'](
                    function () {
                        return (
                            (Module.mWorkletNode === null &&
                                Module.mModulePolling) ||
                            !Module.mWorkletNodeConnected
                        );
                    },
                    function () {
                        if (Module.mWorkletNode) {
                            Module.mWorkletNode.disconnect();
                            Module.mWorkletNodeConnected = false;
                        }
                    },
                );
            },
            293060: function ($0, $1, $2) {
                const buffer = $0;
                const bufferLength = $1;
                const speakerModeChannels = $2;
                var data = HEAPF32.subarray(
                    buffer / 4,
                    buffer / 4 + bufferLength * speakerModeChannels,
                );
                for (
                    var channel = 0;
                    channel < speakerModeChannels;
                    channel++
                ) {
                    const offset = channel * bufferLength;
                    for (var sample = 0; sample < bufferLength; sample++) {
                        Module.mOutputData[sample + offset] =
                            data[sample * speakerModeChannels + channel];
                    }
                }
            },
            293487: function ($0, $1, $2, $3) {
                const buffer = $0;
                const bufferLength = $1;
                const speakerModeChannels = $2;
                const frameFlag = $3;
                var data = HEAPF32.subarray(
                    buffer / 4,
                    buffer / 4 + bufferLength * speakerModeChannels,
                );
                const arrayOffset =
                    speakerModeChannels * frameFlag * bufferLength;
                for (
                    var channel = 0;
                    channel < speakerModeChannels;
                    channel++
                ) {
                    const offset = channel * bufferLength + arrayOffset;
                    for (var sample = 0; sample < bufferLength; sample++) {
                        Module.mOutputData[sample + offset] =
                            data[sample * speakerModeChannels + channel];
                    }
                }
            },
            294018: function () {
                if (Module.mContext) {
                    Module.mContext.suspend();
                }
            },
            294074: function () {
                if (Module.mContext) {
                    Module.mContext.resume();
                }
            },
        };
        function callRuntimeCallbacks(callbacks) {
            while (callbacks.length > 0) {
                var callback = callbacks.shift();
                if (typeof callback == 'function') {
                    callback(Module);
                    continue;
                }
                var func = callback.func;
                if (typeof func === 'number') {
                    if (callback.arg === undefined) {
                        (function () {
                            dynCall_v.call(null, func);
                        })();
                    } else {
                        (function (a1) {
                            dynCall_vi.apply(null, [func, a1]);
                        })(callback.arg);
                    }
                } else {
                    func(callback.arg === undefined ? null : callback.arg);
                }
            }
        }
        var runtimeKeepaliveCounter = 0;
        function keepRuntimeAlive() {
            return noExitRuntime || runtimeKeepaliveCounter > 0;
        }
        function setErrNo(value) {
            HEAP32[___errno_location() >> 2] = value;
            return value;
        }
        var PATH = {
            splitPath: function (filename) {
                var splitPathRe =
                    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
                return splitPathRe.exec(filename).slice(1);
            },
            normalizeArray: function (parts, allowAboveRoot) {
                var up = 0;
                for (var i = parts.length - 1; i >= 0; i--) {
                    var last = parts[i];
                    if (last === '.') {
                        parts.splice(i, 1);
                    } else if (last === '..') {
                        parts.splice(i, 1);
                        up++;
                    } else if (up) {
                        parts.splice(i, 1);
                        up--;
                    }
                }
                if (allowAboveRoot) {
                    for (; up; up--) {
                        parts.unshift('..');
                    }
                }
                return parts;
            },
            normalize: function (path) {
                var isAbsolute = path.charAt(0) === '/',
                    trailingSlash = path.substr(-1) === '/';
                path = PATH.normalizeArray(
                    path.split('/').filter(function (p) {
                        return !!p;
                    }),
                    !isAbsolute,
                ).join('/');
                if (!path && !isAbsolute) {
                    path = '.';
                }
                if (path && trailingSlash) {
                    path += '/';
                }
                return (isAbsolute ? '/' : '') + path;
            },
            dirname: function (path) {
                var result = PATH.splitPath(path),
                    root = result[0],
                    dir = result[1];
                if (!root && !dir) {
                    return '.';
                }
                if (dir) {
                    dir = dir.substr(0, dir.length - 1);
                }
                return root + dir;
            },
            basename: function (path) {
                if (path === '/') return '/';
                path = PATH.normalize(path);
                path = path.replace(/\/$/, '');
                var lastSlash = path.lastIndexOf('/');
                if (lastSlash === -1) return path;
                return path.substr(lastSlash + 1);
            },
            extname: function (path) {
                return PATH.splitPath(path)[3];
            },
            join: function () {
                var paths = Array.prototype.slice.call(arguments, 0);
                return PATH.normalize(paths.join('/'));
            },
            join2: function (l, r) {
                return PATH.normalize(l + '/' + r);
            },
        };
        function getRandomDevice() {
            if (
                typeof crypto === 'object' &&
                typeof crypto['getRandomValues'] === 'function'
            ) {
                var randomBuffer = new Uint8Array(1);
                return function () {
                    crypto.getRandomValues(randomBuffer);
                    return randomBuffer[0];
                };
            } else if (ENVIRONMENT_IS_NODE) {
                try {
                    var crypto_module = require('crypto');
                    return function () {
                        return crypto_module['randomBytes'](1)[0];
                    };
                } catch (e) {}
            }
            return function () {
                abort('randomDevice');
            };
        }
        var PATH_FS = {
            resolve: function () {
                var resolvedPath = '',
                    resolvedAbsolute = false;
                for (
                    var i = arguments.length - 1;
                    i >= -1 && !resolvedAbsolute;
                    i--
                ) {
                    var path = i >= 0 ? arguments[i] : FS.cwd();
                    if (typeof path !== 'string') {
                        throw new TypeError(
                            'Arguments to path.resolve must be strings',
                        );
                    } else if (!path) {
                        return '';
                    }
                    resolvedPath = path + '/' + resolvedPath;
                    resolvedAbsolute = path.charAt(0) === '/';
                }
                resolvedPath = PATH.normalizeArray(
                    resolvedPath.split('/').filter(function (p) {
                        return !!p;
                    }),
                    !resolvedAbsolute,
                ).join('/');
                return (resolvedAbsolute ? '/' : '') + resolvedPath || '.';
            },
            relative: function (from, to) {
                from = PATH_FS.resolve(from).substr(1);
                to = PATH_FS.resolve(to).substr(1);
                function trim(arr) {
                    var start = 0;
                    for (; start < arr.length; start++) {
                        if (arr[start] !== '') break;
                    }
                    var end = arr.length - 1;
                    for (; end >= 0; end--) {
                        if (arr[end] !== '') break;
                    }
                    if (start > end) return [];
                    return arr.slice(start, end - start + 1);
                }
                var fromParts = trim(from.split('/'));
                var toParts = trim(to.split('/'));
                var length = Math.min(fromParts.length, toParts.length);
                var samePartsLength = length;
                for (var i = 0; i < length; i++) {
                    if (fromParts[i] !== toParts[i]) {
                        samePartsLength = i;
                        break;
                    }
                }
                var outputParts = [];
                for (var i = samePartsLength; i < fromParts.length; i++) {
                    outputParts.push('..');
                }
                outputParts = outputParts.concat(
                    toParts.slice(samePartsLength),
                );
                return outputParts.join('/');
            },
        };
        var TTY = {
            ttys: [],
            init: function () {},
            shutdown: function () {},
            register: function (dev, ops) {
                TTY.ttys[dev] = { input: [], output: [], ops: ops };
                FS.registerDevice(dev, TTY.stream_ops);
            },
            stream_ops: {
                open: function (stream) {
                    var tty = TTY.ttys[stream.node.rdev];
                    if (!tty) {
                        throw new FS.ErrnoError(43);
                    }
                    stream.tty = tty;
                    stream.seekable = false;
                },
                close: function (stream) {
                    stream.tty.ops.flush(stream.tty);
                },
                flush: function (stream) {
                    stream.tty.ops.flush(stream.tty);
                },
                read: function (stream, buffer, offset, length, pos) {
                    if (!stream.tty || !stream.tty.ops.get_char) {
                        throw new FS.ErrnoError(60);
                    }
                    var bytesRead = 0;
                    for (var i = 0; i < length; i++) {
                        var result;
                        try {
                            result = stream.tty.ops.get_char(stream.tty);
                        } catch (e) {
                            throw new FS.ErrnoError(29);
                        }
                        if (result === undefined && bytesRead === 0) {
                            throw new FS.ErrnoError(6);
                        }
                        if (result === null || result === undefined) break;
                        bytesRead++;
                        buffer[offset + i] = result;
                    }
                    if (bytesRead) {
                        stream.node.timestamp = Date.now();
                    }
                    return bytesRead;
                },
                write: function (stream, buffer, offset, length, pos) {
                    if (!stream.tty || !stream.tty.ops.put_char) {
                        throw new FS.ErrnoError(60);
                    }
                    try {
                        for (var i = 0; i < length; i++) {
                            stream.tty.ops.put_char(
                                stream.tty,
                                buffer[offset + i],
                            );
                        }
                    } catch (e) {
                        throw new FS.ErrnoError(29);
                    }
                    if (length) {
                        stream.node.timestamp = Date.now();
                    }
                    return i;
                },
            },
            default_tty_ops: {
                get_char: function (tty) {
                    if (!tty.input.length) {
                        var result = null;
                        if (ENVIRONMENT_IS_NODE) {
                            var BUFSIZE = 256;
                            var buf = Buffer.alloc
                                ? Buffer.alloc(BUFSIZE)
                                : new Buffer(BUFSIZE);
                            var bytesRead = 0;
                            try {
                                bytesRead = nodeFS.readSync(
                                    process.stdin.fd,
                                    buf,
                                    0,
                                    BUFSIZE,
                                    null,
                                );
                            } catch (e) {
                                if (e.toString().includes('EOF')) bytesRead = 0;
                                else throw e;
                            }
                            if (bytesRead > 0) {
                                result = buf
                                    .slice(0, bytesRead)
                                    .toString('utf-8');
                            } else {
                                result = null;
                            }
                        } else if (
                            typeof window != 'undefined' &&
                            typeof window.prompt == 'function'
                        ) {
                            result = window.prompt('Input: ');
                            if (result !== null) {
                                result += '\n';
                            }
                        } else if (typeof readline == 'function') {
                            result = readline();
                            if (result !== null) {
                                result += '\n';
                            }
                        }
                        if (!result) {
                            return null;
                        }
                        tty.input = intArrayFromString(result, true);
                    }
                    return tty.input.shift();
                },
                put_char: function (tty, val) {
                    if (val === null || val === 10) {
                        out(UTF8ArrayToString(tty.output, 0));
                        tty.output = [];
                    } else {
                        if (val != 0) tty.output.push(val);
                    }
                },
                flush: function (tty) {
                    if (tty.output && tty.output.length > 0) {
                        out(UTF8ArrayToString(tty.output, 0));
                        tty.output = [];
                    }
                },
            },
            default_tty1_ops: {
                put_char: function (tty, val) {
                    if (val === null || val === 10) {
                        err(UTF8ArrayToString(tty.output, 0));
                        tty.output = [];
                    } else {
                        if (val != 0) tty.output.push(val);
                    }
                },
                flush: function (tty) {
                    if (tty.output && tty.output.length > 0) {
                        err(UTF8ArrayToString(tty.output, 0));
                        tty.output = [];
                    }
                },
            },
        };
        function mmapAlloc(size) {
            var alignedSize = alignMemory(size, 65536);
            var ptr = _malloc(alignedSize);
            while (size < alignedSize) HEAP8[ptr + size++] = 0;
            return ptr;
        }
        var MEMFS = {
            ops_table: null,
            mount: function (mount) {
                return MEMFS.createNode(null, '/', 16384 | 511, 0);
            },
            createNode: function (parent, name, mode, dev) {
                if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
                    throw new FS.ErrnoError(63);
                }
                if (!MEMFS.ops_table) {
                    MEMFS.ops_table = {
                        dir: {
                            node: {
                                getattr: MEMFS.node_ops.getattr,
                                setattr: MEMFS.node_ops.setattr,
                                lookup: MEMFS.node_ops.lookup,
                                mknod: MEMFS.node_ops.mknod,
                                rename: MEMFS.node_ops.rename,
                                unlink: MEMFS.node_ops.unlink,
                                rmdir: MEMFS.node_ops.rmdir,
                                readdir: MEMFS.node_ops.readdir,
                                symlink: MEMFS.node_ops.symlink,
                            },
                            stream: { llseek: MEMFS.stream_ops.llseek },
                        },
                        file: {
                            node: {
                                getattr: MEMFS.node_ops.getattr,
                                setattr: MEMFS.node_ops.setattr,
                            },
                            stream: {
                                llseek: MEMFS.stream_ops.llseek,
                                read: MEMFS.stream_ops.read,
                                write: MEMFS.stream_ops.write,
                                allocate: MEMFS.stream_ops.allocate,
                                mmap: MEMFS.stream_ops.mmap,
                                msync: MEMFS.stream_ops.msync,
                            },
                        },
                        link: {
                            node: {
                                getattr: MEMFS.node_ops.getattr,
                                setattr: MEMFS.node_ops.setattr,
                                readlink: MEMFS.node_ops.readlink,
                            },
                            stream: {},
                        },
                        chrdev: {
                            node: {
                                getattr: MEMFS.node_ops.getattr,
                                setattr: MEMFS.node_ops.setattr,
                            },
                            stream: FS.chrdev_stream_ops,
                        },
                    };
                }
                var node = FS.createNode(parent, name, mode, dev);
                if (FS.isDir(node.mode)) {
                    node.node_ops = MEMFS.ops_table.dir.node;
                    node.stream_ops = MEMFS.ops_table.dir.stream;
                    node.contents = {};
                } else if (FS.isFile(node.mode)) {
                    node.node_ops = MEMFS.ops_table.file.node;
                    node.stream_ops = MEMFS.ops_table.file.stream;
                    node.usedBytes = 0;
                    node.contents = null;
                } else if (FS.isLink(node.mode)) {
                    node.node_ops = MEMFS.ops_table.link.node;
                    node.stream_ops = MEMFS.ops_table.link.stream;
                } else if (FS.isChrdev(node.mode)) {
                    node.node_ops = MEMFS.ops_table.chrdev.node;
                    node.stream_ops = MEMFS.ops_table.chrdev.stream;
                }
                node.timestamp = Date.now();
                if (parent) {
                    parent.contents[name] = node;
                    parent.timestamp = node.timestamp;
                }
                return node;
            },
            getFileDataAsTypedArray: function (node) {
                if (!node.contents) return new Uint8Array(0);
                if (node.contents.subarray)
                    return node.contents.subarray(0, node.usedBytes);
                return new Uint8Array(node.contents);
            },
            expandFileStorage: function (node, newCapacity) {
                var prevCapacity = node.contents ? node.contents.length : 0;
                if (prevCapacity >= newCapacity) return;
                var CAPACITY_DOUBLING_MAX = 1024 * 1024;
                newCapacity = Math.max(
                    newCapacity,
                    (prevCapacity *
                        (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125)) >>>
                        0,
                );
                if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
                var oldContents = node.contents;
                node.contents = new Uint8Array(newCapacity);
                if (node.usedBytes > 0)
                    node.contents.set(
                        oldContents.subarray(0, node.usedBytes),
                        0,
                    );
            },
            resizeFileStorage: function (node, newSize) {
                if (node.usedBytes == newSize) return;
                if (newSize == 0) {
                    node.contents = null;
                    node.usedBytes = 0;
                } else {
                    var oldContents = node.contents;
                    node.contents = new Uint8Array(newSize);
                    if (oldContents) {
                        node.contents.set(
                            oldContents.subarray(
                                0,
                                Math.min(newSize, node.usedBytes),
                            ),
                        );
                    }
                    node.usedBytes = newSize;
                }
            },
            node_ops: {
                getattr: function (node) {
                    var attr = {};
                    attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
                    attr.ino = node.id;
                    attr.mode = node.mode;
                    attr.nlink = 1;
                    attr.uid = 0;
                    attr.gid = 0;
                    attr.rdev = node.rdev;
                    if (FS.isDir(node.mode)) {
                        attr.size = 4096;
                    } else if (FS.isFile(node.mode)) {
                        attr.size = node.usedBytes;
                    } else if (FS.isLink(node.mode)) {
                        attr.size = node.link.length;
                    } else {
                        attr.size = 0;
                    }
                    attr.atime = new Date(node.timestamp);
                    attr.mtime = new Date(node.timestamp);
                    attr.ctime = new Date(node.timestamp);
                    attr.blksize = 4096;
                    attr.blocks = Math.ceil(attr.size / attr.blksize);
                    return attr;
                },
                setattr: function (node, attr) {
                    if (attr.mode !== undefined) {
                        node.mode = attr.mode;
                    }
                    if (attr.timestamp !== undefined) {
                        node.timestamp = attr.timestamp;
                    }
                    if (attr.size !== undefined) {
                        MEMFS.resizeFileStorage(node, attr.size);
                    }
                },
                lookup: function (parent, name) {
                    throw FS.genericErrors[44];
                },
                mknod: function (parent, name, mode, dev) {
                    return MEMFS.createNode(parent, name, mode, dev);
                },
                rename: function (old_node, new_dir, new_name) {
                    if (FS.isDir(old_node.mode)) {
                        var new_node;
                        try {
                            new_node = FS.lookupNode(new_dir, new_name);
                        } catch (e) {}
                        if (new_node) {
                            for (var i in new_node.contents) {
                                throw new FS.ErrnoError(55);
                            }
                        }
                    }
                    delete old_node.parent.contents[old_node.name];
                    old_node.parent.timestamp = Date.now();
                    old_node.name = new_name;
                    new_dir.contents[new_name] = old_node;
                    new_dir.timestamp = old_node.parent.timestamp;
                    old_node.parent = new_dir;
                },
                unlink: function (parent, name) {
                    delete parent.contents[name];
                    parent.timestamp = Date.now();
                },
                rmdir: function (parent, name) {
                    var node = FS.lookupNode(parent, name);
                    for (var i in node.contents) {
                        throw new FS.ErrnoError(55);
                    }
                    delete parent.contents[name];
                    parent.timestamp = Date.now();
                },
                readdir: function (node) {
                    var entries = ['.', '..'];
                    for (var key in node.contents) {
                        if (!node.contents.hasOwnProperty(key)) {
                            continue;
                        }
                        entries.push(key);
                    }
                    return entries;
                },
                symlink: function (parent, newname, oldpath) {
                    var node = MEMFS.createNode(
                        parent,
                        newname,
                        511 | 40960,
                        0,
                    );
                    node.link = oldpath;
                    return node;
                },
                readlink: function (node) {
                    if (!FS.isLink(node.mode)) {
                        throw new FS.ErrnoError(28);
                    }
                    return node.link;
                },
            },
            stream_ops: {
                read: function (stream, buffer, offset, length, position) {
                    var contents = stream.node.contents;
                    if (position >= stream.node.usedBytes) return 0;
                    var size = Math.min(
                        stream.node.usedBytes - position,
                        length,
                    );
                    if (size > 8 && contents.subarray) {
                        buffer.set(
                            contents.subarray(position, position + size),
                            offset,
                        );
                    } else {
                        for (var i = 0; i < size; i++)
                            buffer[offset + i] = contents[position + i];
                    }
                    return size;
                },
                write: function (
                    stream,
                    buffer,
                    offset,
                    length,
                    position,
                    canOwn,
                ) {
                    if (buffer.buffer === HEAP8.buffer) {
                        canOwn = false;
                    }
                    if (!length) return 0;
                    var node = stream.node;
                    node.timestamp = Date.now();
                    if (
                        buffer.subarray &&
                        (!node.contents || node.contents.subarray)
                    ) {
                        if (canOwn) {
                            node.contents = buffer.subarray(
                                offset,
                                offset + length,
                            );
                            node.usedBytes = length;
                            return length;
                        } else if (node.usedBytes === 0 && position === 0) {
                            node.contents = buffer.slice(
                                offset,
                                offset + length,
                            );
                            node.usedBytes = length;
                            return length;
                        } else if (position + length <= node.usedBytes) {
                            node.contents.set(
                                buffer.subarray(offset, offset + length),
                                position,
                            );
                            return length;
                        }
                    }
                    MEMFS.expandFileStorage(node, position + length);
                    if (node.contents.subarray && buffer.subarray) {
                        node.contents.set(
                            buffer.subarray(offset, offset + length),
                            position,
                        );
                    } else {
                        for (var i = 0; i < length; i++) {
                            node.contents[position + i] = buffer[offset + i];
                        }
                    }
                    node.usedBytes = Math.max(
                        node.usedBytes,
                        position + length,
                    );
                    return length;
                },
                llseek: function (stream, offset, whence) {
                    var position = offset;
                    if (whence === 1) {
                        position += stream.position;
                    } else if (whence === 2) {
                        if (FS.isFile(stream.node.mode)) {
                            position += stream.node.usedBytes;
                        }
                    }
                    if (position < 0) {
                        throw new FS.ErrnoError(28);
                    }
                    return position;
                },
                allocate: function (stream, offset, length) {
                    MEMFS.expandFileStorage(stream.node, offset + length);
                    stream.node.usedBytes = Math.max(
                        stream.node.usedBytes,
                        offset + length,
                    );
                },
                mmap: function (
                    stream,
                    address,
                    length,
                    position,
                    prot,
                    flags,
                ) {
                    if (address !== 0) {
                        throw new FS.ErrnoError(28);
                    }
                    if (!FS.isFile(stream.node.mode)) {
                        throw new FS.ErrnoError(43);
                    }
                    var ptr;
                    var allocated;
                    var contents = stream.node.contents;
                    if (!(flags & 2) && contents.buffer === buffer) {
                        allocated = false;
                        ptr = contents.byteOffset;
                    } else {
                        if (
                            position > 0 ||
                            position + length < contents.length
                        ) {
                            if (contents.subarray) {
                                contents = contents.subarray(
                                    position,
                                    position + length,
                                );
                            } else {
                                contents = Array.prototype.slice.call(
                                    contents,
                                    position,
                                    position + length,
                                );
                            }
                        }
                        allocated = true;
                        ptr = mmapAlloc(length);
                        if (!ptr) {
                            throw new FS.ErrnoError(48);
                        }
                        HEAP8.set(contents, ptr);
                    }
                    return { ptr: ptr, allocated: allocated };
                },
                msync: function (stream, buffer, offset, length, mmapFlags) {
                    if (!FS.isFile(stream.node.mode)) {
                        throw new FS.ErrnoError(43);
                    }
                    if (mmapFlags & 2) {
                        return 0;
                    }
                    var bytesWritten = MEMFS.stream_ops.write(
                        stream,
                        buffer,
                        0,
                        length,
                        offset,
                        false,
                    );
                    return 0;
                },
            },
        };
        var FS = {
            root: null,
            mounts: [],
            devices: {},
            streams: [],
            nextInode: 1,
            nameTable: null,
            currentPath: '/',
            initialized: false,
            ignorePermissions: true,
            trackingDelegate: {},
            tracking: { openFlags: { READ: 1, WRITE: 2 } },
            ErrnoError: null,
            genericErrors: {},
            filesystems: null,
            syncFSRequests: 0,
            lookupPath: function (path, opts) {
                path = PATH_FS.resolve(FS.cwd(), path);
                opts = opts || {};
                if (!path) return { path: '', node: null };
                var defaults = { follow_mount: true, recurse_count: 0 };
                for (var key in defaults) {
                    if (opts[key] === undefined) {
                        opts[key] = defaults[key];
                    }
                }
                if (opts.recurse_count > 8) {
                    throw new FS.ErrnoError(32);
                }
                var parts = PATH.normalizeArray(
                    path.split('/').filter(function (p) {
                        return !!p;
                    }),
                    false,
                );
                var current = FS.root;
                var current_path = '/';
                for (var i = 0; i < parts.length; i++) {
                    var islast = i === parts.length - 1;
                    if (islast && opts.parent) {
                        break;
                    }
                    current = FS.lookupNode(current, parts[i]);
                    current_path = PATH.join2(current_path, parts[i]);
                    if (FS.isMountpoint(current)) {
                        if (!islast || (islast && opts.follow_mount)) {
                            current = current.mounted.root;
                        }
                    }
                    if (!islast || opts.follow) {
                        var count = 0;
                        while (FS.isLink(current.mode)) {
                            var link = FS.readlink(current_path);
                            current_path = PATH_FS.resolve(
                                PATH.dirname(current_path),
                                link,
                            );
                            var lookup = FS.lookupPath(current_path, {
                                recurse_count: opts.recurse_count,
                            });
                            current = lookup.node;
                            if (count++ > 40) {
                                throw new FS.ErrnoError(32);
                            }
                        }
                    }
                }
                return { path: current_path, node: current };
            },
            getPath: function (node) {
                var path;
                while (true) {
                    if (FS.isRoot(node)) {
                        var mount = node.mount.mountpoint;
                        if (!path) return mount;
                        return mount[mount.length - 1] !== '/'
                            ? mount + '/' + path
                            : mount + path;
                    }
                    path = path ? node.name + '/' + path : node.name;
                    node = node.parent;
                }
            },
            hashName: function (parentid, name) {
                var hash = 0;
                for (var i = 0; i < name.length; i++) {
                    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
                }
                return ((parentid + hash) >>> 0) % FS.nameTable.length;
            },
            hashAddNode: function (node) {
                var hash = FS.hashName(node.parent.id, node.name);
                node.name_next = FS.nameTable[hash];
                FS.nameTable[hash] = node;
            },
            hashRemoveNode: function (node) {
                var hash = FS.hashName(node.parent.id, node.name);
                if (FS.nameTable[hash] === node) {
                    FS.nameTable[hash] = node.name_next;
                } else {
                    var current = FS.nameTable[hash];
                    while (current) {
                        if (current.name_next === node) {
                            current.name_next = node.name_next;
                            break;
                        }
                        current = current.name_next;
                    }
                }
            },
            lookupNode: function (parent, name) {
                var errCode = FS.mayLookup(parent);
                if (errCode) {
                    throw new FS.ErrnoError(errCode, parent);
                }
                var hash = FS.hashName(parent.id, name);
                for (
                    var node = FS.nameTable[hash];
                    node;
                    node = node.name_next
                ) {
                    var nodeName = node.name;
                    if (node.parent.id === parent.id && nodeName === name) {
                        return node;
                    }
                }
                return FS.lookup(parent, name);
            },
            createNode: function (parent, name, mode, rdev) {
                var node = new FS.FSNode(parent, name, mode, rdev);
                FS.hashAddNode(node);
                return node;
            },
            destroyNode: function (node) {
                FS.hashRemoveNode(node);
            },
            isRoot: function (node) {
                return node === node.parent;
            },
            isMountpoint: function (node) {
                return !!node.mounted;
            },
            isFile: function (mode) {
                return (mode & 61440) === 32768;
            },
            isDir: function (mode) {
                return (mode & 61440) === 16384;
            },
            isLink: function (mode) {
                return (mode & 61440) === 40960;
            },
            isChrdev: function (mode) {
                return (mode & 61440) === 8192;
            },
            isBlkdev: function (mode) {
                return (mode & 61440) === 24576;
            },
            isFIFO: function (mode) {
                return (mode & 61440) === 4096;
            },
            isSocket: function (mode) {
                return (mode & 49152) === 49152;
            },
            flagModes: {
                r: 0,
                'r+': 2,
                w: 577,
                'w+': 578,
                a: 1089,
                'a+': 1090,
            },
            modeStringToFlags: function (str) {
                var flags = FS.flagModes[str];
                if (typeof flags === 'undefined') {
                    throw new Error('Unknown file open mode: ' + str);
                }
                return flags;
            },
            flagsToPermissionString: function (flag) {
                var perms = ['r', 'w', 'rw'][flag & 3];
                if (flag & 512) {
                    perms += 'w';
                }
                return perms;
            },
            nodePermissions: function (node, perms) {
                if (FS.ignorePermissions) {
                    return 0;
                }
                if (perms.includes('r') && !(node.mode & 292)) {
                    return 2;
                } else if (perms.includes('w') && !(node.mode & 146)) {
                    return 2;
                } else if (perms.includes('x') && !(node.mode & 73)) {
                    return 2;
                }
                return 0;
            },
            mayLookup: function (dir) {
                var errCode = FS.nodePermissions(dir, 'x');
                if (errCode) return errCode;
                if (!dir.node_ops.lookup) return 2;
                return 0;
            },
            mayCreate: function (dir, name) {
                try {
                    var node = FS.lookupNode(dir, name);
                    return 20;
                } catch (e) {}
                return FS.nodePermissions(dir, 'wx');
            },
            mayDelete: function (dir, name, isdir) {
                var node;
                try {
                    node = FS.lookupNode(dir, name);
                } catch (e) {
                    return e.errno;
                }
                var errCode = FS.nodePermissions(dir, 'wx');
                if (errCode) {
                    return errCode;
                }
                if (isdir) {
                    if (!FS.isDir(node.mode)) {
                        return 54;
                    }
                    if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                        return 10;
                    }
                } else {
                    if (FS.isDir(node.mode)) {
                        return 31;
                    }
                }
                return 0;
            },
            mayOpen: function (node, flags) {
                if (!node) {
                    return 44;
                }
                if (FS.isLink(node.mode)) {
                    return 32;
                } else if (FS.isDir(node.mode)) {
                    if (
                        FS.flagsToPermissionString(flags) !== 'r' ||
                        flags & 512
                    ) {
                        return 31;
                    }
                }
                return FS.nodePermissions(
                    node,
                    FS.flagsToPermissionString(flags),
                );
            },
            MAX_OPEN_FDS: 4096,
            nextfd: function (fd_start, fd_end) {
                fd_start = fd_start || 0;
                fd_end = fd_end || FS.MAX_OPEN_FDS;
                for (var fd = fd_start; fd <= fd_end; fd++) {
                    if (!FS.streams[fd]) {
                        return fd;
                    }
                }
                throw new FS.ErrnoError(33);
            },
            getStream: function (fd) {
                return FS.streams[fd];
            },
            createStream: function (stream, fd_start, fd_end) {
                if (!FS.FSStream) {
                    FS.FSStream = function () {};
                    FS.FSStream.prototype = {
                        object: {
                            get: function () {
                                return this.node;
                            },
                            set: function (val) {
                                this.node = val;
                            },
                        },
                        isRead: {
                            get: function () {
                                return (this.flags & 2097155) !== 1;
                            },
                        },
                        isWrite: {
                            get: function () {
                                return (this.flags & 2097155) !== 0;
                            },
                        },
                        isAppend: {
                            get: function () {
                                return this.flags & 1024;
                            },
                        },
                    };
                }
                var newStream = new FS.FSStream();
                for (var p in stream) {
                    newStream[p] = stream[p];
                }
                stream = newStream;
                var fd = FS.nextfd(fd_start, fd_end);
                stream.fd = fd;
                FS.streams[fd] = stream;
                return stream;
            },
            closeStream: function (fd) {
                FS.streams[fd] = null;
            },
            chrdev_stream_ops: {
                open: function (stream) {
                    var device = FS.getDevice(stream.node.rdev);
                    stream.stream_ops = device.stream_ops;
                    if (stream.stream_ops.open) {
                        stream.stream_ops.open(stream);
                    }
                },
                llseek: function () {
                    throw new FS.ErrnoError(70);
                },
            },
            major: function (dev) {
                return dev >> 8;
            },
            minor: function (dev) {
                return dev & 255;
            },
            makedev: function (ma, mi) {
                return (ma << 8) | mi;
            },
            registerDevice: function (dev, ops) {
                FS.devices[dev] = { stream_ops: ops };
            },
            getDevice: function (dev) {
                return FS.devices[dev];
            },
            getMounts: function (mount) {
                var mounts = [];
                var check = [mount];
                while (check.length) {
                    var m = check.pop();
                    mounts.push(m);
                    check.push.apply(check, m.mounts);
                }
                return mounts;
            },
            syncfs: function (populate, callback) {
                if (typeof populate === 'function') {
                    callback = populate;
                    populate = false;
                }
                FS.syncFSRequests++;
                if (FS.syncFSRequests > 1) {
                    err(
                        'warning: ' +
                            FS.syncFSRequests +
                            ' FS.syncfs operations in flight at once, probably just doing extra work',
                    );
                }
                var mounts = FS.getMounts(FS.root.mount);
                var completed = 0;
                function doCallback(errCode) {
                    FS.syncFSRequests--;
                    return callback(errCode);
                }
                function done(errCode) {
                    if (errCode) {
                        if (!done.errored) {
                            done.errored = true;
                            return doCallback(errCode);
                        }
                        return;
                    }
                    if (++completed >= mounts.length) {
                        doCallback(null);
                    }
                }
                mounts.forEach(function (mount) {
                    if (!mount.type.syncfs) {
                        return done(null);
                    }
                    mount.type.syncfs(mount, populate, done);
                });
            },
            mount: function (type, opts, mountpoint) {
                var root = mountpoint === '/';
                var pseudo = !mountpoint;
                var node;
                if (root && FS.root) {
                    throw new FS.ErrnoError(10);
                } else if (!root && !pseudo) {
                    var lookup = FS.lookupPath(mountpoint, {
                        follow_mount: false,
                    });
                    mountpoint = lookup.path;
                    node = lookup.node;
                    if (FS.isMountpoint(node)) {
                        throw new FS.ErrnoError(10);
                    }
                    if (!FS.isDir(node.mode)) {
                        throw new FS.ErrnoError(54);
                    }
                }
                var mount = {
                    type: type,
                    opts: opts,
                    mountpoint: mountpoint,
                    mounts: [],
                };
                var mountRoot = type.mount(mount);
                mountRoot.mount = mount;
                mount.root = mountRoot;
                if (root) {
                    FS.root = mountRoot;
                } else if (node) {
                    node.mounted = mount;
                    if (node.mount) {
                        node.mount.mounts.push(mount);
                    }
                }
                return mountRoot;
            },
            unmount: function (mountpoint) {
                var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
                if (!FS.isMountpoint(lookup.node)) {
                    throw new FS.ErrnoError(28);
                }
                var node = lookup.node;
                var mount = node.mounted;
                var mounts = FS.getMounts(mount);
                Object.keys(FS.nameTable).forEach(function (hash) {
                    var current = FS.nameTable[hash];
                    while (current) {
                        var next = current.name_next;
                        if (mounts.includes(current.mount)) {
                            FS.destroyNode(current);
                        }
                        current = next;
                    }
                });
                node.mounted = null;
                var idx = node.mount.mounts.indexOf(mount);
                node.mount.mounts.splice(idx, 1);
            },
            lookup: function (parent, name) {
                return parent.node_ops.lookup(parent, name);
            },
            mknod: function (path, mode, dev) {
                var lookup = FS.lookupPath(path, { parent: true });
                var parent = lookup.node;
                var name = PATH.basename(path);
                if (!name || name === '.' || name === '..') {
                    throw new FS.ErrnoError(28);
                }
                var errCode = FS.mayCreate(parent, name);
                if (errCode) {
                    throw new FS.ErrnoError(errCode);
                }
                if (!parent.node_ops.mknod) {
                    throw new FS.ErrnoError(63);
                }
                return parent.node_ops.mknod(parent, name, mode, dev);
            },
            create: function (path, mode) {
                mode = mode !== undefined ? mode : 438;
                mode &= 4095;
                mode |= 32768;
                return FS.mknod(path, mode, 0);
            },
            mkdir: function (path, mode) {
                mode = mode !== undefined ? mode : 511;
                mode &= 511 | 512;
                mode |= 16384;
                return FS.mknod(path, mode, 0);
            },
            mkdirTree: function (path, mode) {
                var dirs = path.split('/');
                var d = '';
                for (var i = 0; i < dirs.length; ++i) {
                    if (!dirs[i]) continue;
                    d += '/' + dirs[i];
                    try {
                        FS.mkdir(d, mode);
                    } catch (e) {
                        if (e.errno != 20) throw e;
                    }
                }
            },
            mkdev: function (path, mode, dev) {
                if (typeof dev === 'undefined') {
                    dev = mode;
                    mode = 438;
                }
                mode |= 8192;
                return FS.mknod(path, mode, dev);
            },
            symlink: function (oldpath, newpath) {
                if (!PATH_FS.resolve(oldpath)) {
                    throw new FS.ErrnoError(44);
                }
                var lookup = FS.lookupPath(newpath, { parent: true });
                var parent = lookup.node;
                if (!parent) {
                    throw new FS.ErrnoError(44);
                }
                var newname = PATH.basename(newpath);
                var errCode = FS.mayCreate(parent, newname);
                if (errCode) {
                    throw new FS.ErrnoError(errCode);
                }
                if (!parent.node_ops.symlink) {
                    throw new FS.ErrnoError(63);
                }
                return parent.node_ops.symlink(parent, newname, oldpath);
            },
            rename: function (old_path, new_path) {
                var old_dirname = PATH.dirname(old_path);
                var new_dirname = PATH.dirname(new_path);
                var old_name = PATH.basename(old_path);
                var new_name = PATH.basename(new_path);
                var lookup, old_dir, new_dir;
                lookup = FS.lookupPath(old_path, { parent: true });
                old_dir = lookup.node;
                lookup = FS.lookupPath(new_path, { parent: true });
                new_dir = lookup.node;
                if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
                if (old_dir.mount !== new_dir.mount) {
                    throw new FS.ErrnoError(75);
                }
                var old_node = FS.lookupNode(old_dir, old_name);
                var relative = PATH_FS.relative(old_path, new_dirname);
                if (relative.charAt(0) !== '.') {
                    throw new FS.ErrnoError(28);
                }
                relative = PATH_FS.relative(new_path, old_dirname);
                if (relative.charAt(0) !== '.') {
                    throw new FS.ErrnoError(55);
                }
                var new_node;
                try {
                    new_node = FS.lookupNode(new_dir, new_name);
                } catch (e) {}
                if (old_node === new_node) {
                    return;
                }
                var isdir = FS.isDir(old_node.mode);
                var errCode = FS.mayDelete(old_dir, old_name, isdir);
                if (errCode) {
                    throw new FS.ErrnoError(errCode);
                }
                errCode = new_node
                    ? FS.mayDelete(new_dir, new_name, isdir)
                    : FS.mayCreate(new_dir, new_name);
                if (errCode) {
                    throw new FS.ErrnoError(errCode);
                }
                if (!old_dir.node_ops.rename) {
                    throw new FS.ErrnoError(63);
                }
                if (
                    FS.isMountpoint(old_node) ||
                    (new_node && FS.isMountpoint(new_node))
                ) {
                    throw new FS.ErrnoError(10);
                }
                if (new_dir !== old_dir) {
                    errCode = FS.nodePermissions(old_dir, 'w');
                    if (errCode) {
                        throw new FS.ErrnoError(errCode);
                    }
                }
                try {
                    if (FS.trackingDelegate['willMovePath']) {
                        FS.trackingDelegate['willMovePath'](old_path, new_path);
                    }
                } catch (e) {
                    err(
                        "FS.trackingDelegate['willMovePath']('" +
                            old_path +
                            "', '" +
                            new_path +
                            "') threw an exception: " +
                            e.message,
                    );
                }
                FS.hashRemoveNode(old_node);
                try {
                    old_dir.node_ops.rename(old_node, new_dir, new_name);
                } catch (e) {
                    throw e;
                } finally {
                    FS.hashAddNode(old_node);
                }
                try {
                    if (FS.trackingDelegate['onMovePath'])
                        FS.trackingDelegate['onMovePath'](old_path, new_path);
                } catch (e) {
                    err(
                        "FS.trackingDelegate['onMovePath']('" +
                            old_path +
                            "', '" +
                            new_path +
                            "') threw an exception: " +
                            e.message,
                    );
                }
            },
            rmdir: function (path) {
                var lookup = FS.lookupPath(path, { parent: true });
                var parent = lookup.node;
                var name = PATH.basename(path);
                var node = FS.lookupNode(parent, name);
                var errCode = FS.mayDelete(parent, name, true);
                if (errCode) {
                    throw new FS.ErrnoError(errCode);
                }
                if (!parent.node_ops.rmdir) {
                    throw new FS.ErrnoError(63);
                }
                if (FS.isMountpoint(node)) {
                    throw new FS.ErrnoError(10);
                }
                try {
                    if (FS.trackingDelegate['willDeletePath']) {
                        FS.trackingDelegate['willDeletePath'](path);
                    }
                } catch (e) {
                    err(
                        "FS.trackingDelegate['willDeletePath']('" +
                            path +
                            "') threw an exception: " +
                            e.message,
                    );
                }
                parent.node_ops.rmdir(parent, name);
                FS.destroyNode(node);
                try {
                    if (FS.trackingDelegate['onDeletePath'])
                        FS.trackingDelegate['onDeletePath'](path);
                } catch (e) {
                    err(
                        "FS.trackingDelegate['onDeletePath']('" +
                            path +
                            "') threw an exception: " +
                            e.message,
                    );
                }
            },
            readdir: function (path) {
                var lookup = FS.lookupPath(path, { follow: true });
                var node = lookup.node;
                if (!node.node_ops.readdir) {
                    throw new FS.ErrnoError(54);
                }
                return node.node_ops.readdir(node);
            },
            unlink: function (path) {
                var lookup = FS.lookupPath(path, { parent: true });
                var parent = lookup.node;
                var name = PATH.basename(path);
                var node = FS.lookupNode(parent, name);
                var errCode = FS.mayDelete(parent, name, false);
                if (errCode) {
                    throw new FS.ErrnoError(errCode);
                }
                if (!parent.node_ops.unlink) {
                    throw new FS.ErrnoError(63);
                }
                if (FS.isMountpoint(node)) {
                    throw new FS.ErrnoError(10);
                }
                try {
                    if (FS.trackingDelegate['willDeletePath']) {
                        FS.trackingDelegate['willDeletePath'](path);
                    }
                } catch (e) {
                    err(
                        "FS.trackingDelegate['willDeletePath']('" +
                            path +
                            "') threw an exception: " +
                            e.message,
                    );
                }
                parent.node_ops.unlink(parent, name);
                FS.destroyNode(node);
                try {
                    if (FS.trackingDelegate['onDeletePath'])
                        FS.trackingDelegate['onDeletePath'](path);
                } catch (e) {
                    err(
                        "FS.trackingDelegate['onDeletePath']('" +
                            path +
                            "') threw an exception: " +
                            e.message,
                    );
                }
            },
            readlink: function (path) {
                var lookup = FS.lookupPath(path);
                var link = lookup.node;
                if (!link) {
                    throw new FS.ErrnoError(44);
                }
                if (!link.node_ops.readlink) {
                    throw new FS.ErrnoError(28);
                }
                return PATH_FS.resolve(
                    FS.getPath(link.parent),
                    link.node_ops.readlink(link),
                );
            },
            stat: function (path, dontFollow) {
                var lookup = FS.lookupPath(path, { follow: !dontFollow });
                var node = lookup.node;
                if (!node) {
                    throw new FS.ErrnoError(44);
                }
                if (!node.node_ops.getattr) {
                    throw new FS.ErrnoError(63);
                }
                return node.node_ops.getattr(node);
            },
            lstat: function (path) {
                return FS.stat(path, true);
            },
            chmod: function (path, mode, dontFollow) {
                var node;
                if (typeof path === 'string') {
                    var lookup = FS.lookupPath(path, { follow: !dontFollow });
                    node = lookup.node;
                } else {
                    node = path;
                }
                if (!node.node_ops.setattr) {
                    throw new FS.ErrnoError(63);
                }
                node.node_ops.setattr(node, {
                    mode: (mode & 4095) | (node.mode & ~4095),
                    timestamp: Date.now(),
                });
            },
            lchmod: function (path, mode) {
                FS.chmod(path, mode, true);
            },
            fchmod: function (fd, mode) {
                var stream = FS.getStream(fd);
                if (!stream) {
                    throw new FS.ErrnoError(8);
                }
                FS.chmod(stream.node, mode);
            },
            chown: function (path, uid, gid, dontFollow) {
                var node;
                if (typeof path === 'string') {
                    var lookup = FS.lookupPath(path, { follow: !dontFollow });
                    node = lookup.node;
                } else {
                    node = path;
                }
                if (!node.node_ops.setattr) {
                    throw new FS.ErrnoError(63);
                }
                node.node_ops.setattr(node, { timestamp: Date.now() });
            },
            lchown: function (path, uid, gid) {
                FS.chown(path, uid, gid, true);
            },
            fchown: function (fd, uid, gid) {
                var stream = FS.getStream(fd);
                if (!stream) {
                    throw new FS.ErrnoError(8);
                }
                FS.chown(stream.node, uid, gid);
            },
            truncate: function (path, len) {
                if (len < 0) {
                    throw new FS.ErrnoError(28);
                }
                var node;
                if (typeof path === 'string') {
                    var lookup = FS.lookupPath(path, { follow: true });
                    node = lookup.node;
                } else {
                    node = path;
                }
                if (!node.node_ops.setattr) {
                    throw new FS.ErrnoError(63);
                }
                if (FS.isDir(node.mode)) {
                    throw new FS.ErrnoError(31);
                }
                if (!FS.isFile(node.mode)) {
                    throw new FS.ErrnoError(28);
                }
                var errCode = FS.nodePermissions(node, 'w');
                if (errCode) {
                    throw new FS.ErrnoError(errCode);
                }
                node.node_ops.setattr(node, {
                    size: len,
                    timestamp: Date.now(),
                });
            },
            ftruncate: function (fd, len) {
                var stream = FS.getStream(fd);
                if (!stream) {
                    throw new FS.ErrnoError(8);
                }
                if ((stream.flags & 2097155) === 0) {
                    throw new FS.ErrnoError(28);
                }
                FS.truncate(stream.node, len);
            },
            utime: function (path, atime, mtime) {
                var lookup = FS.lookupPath(path, { follow: true });
                var node = lookup.node;
                node.node_ops.setattr(node, {
                    timestamp: Math.max(atime, mtime),
                });
            },
            open: function (path, flags, mode, fd_start, fd_end) {
                if (path === '') {
                    throw new FS.ErrnoError(44);
                }
                flags =
                    typeof flags === 'string'
                        ? FS.modeStringToFlags(flags)
                        : flags;
                mode = typeof mode === 'undefined' ? 438 : mode;
                if (flags & 64) {
                    mode = (mode & 4095) | 32768;
                } else {
                    mode = 0;
                }
                var node;
                if (typeof path === 'object') {
                    node = path;
                } else {
                    path = PATH.normalize(path);
                    try {
                        var lookup = FS.lookupPath(path, {
                            follow: !(flags & 131072),
                        });
                        node = lookup.node;
                    } catch (e) {}
                }
                var created = false;
                if (flags & 64) {
                    if (node) {
                        if (flags & 128) {
                            throw new FS.ErrnoError(20);
                        }
                    } else {
                        node = FS.mknod(path, mode, 0);
                        created = true;
                    }
                }
                if (!node) {
                    throw new FS.ErrnoError(44);
                }
                if (FS.isChrdev(node.mode)) {
                    flags &= ~512;
                }
                if (flags & 65536 && !FS.isDir(node.mode)) {
                    throw new FS.ErrnoError(54);
                }
                if (!created) {
                    var errCode = FS.mayOpen(node, flags);
                    if (errCode) {
                        throw new FS.ErrnoError(errCode);
                    }
                }
                if (flags & 512) {
                    FS.truncate(node, 0);
                }
                flags &= ~(128 | 512 | 131072);
                var stream = FS.createStream(
                    {
                        node: node,
                        path: FS.getPath(node),
                        flags: flags,
                        seekable: true,
                        position: 0,
                        stream_ops: node.stream_ops,
                        ungotten: [],
                        error: false,
                    },
                    fd_start,
                    fd_end,
                );
                if (stream.stream_ops.open) {
                    stream.stream_ops.open(stream);
                }
                if (Module['logReadFiles'] && !(flags & 1)) {
                    if (!FS.readFiles) FS.readFiles = {};
                    if (!(path in FS.readFiles)) {
                        FS.readFiles[path] = 1;
                        err('FS.trackingDelegate error on read file: ' + path);
                    }
                }
                try {
                    if (FS.trackingDelegate['onOpenFile']) {
                        var trackingFlags = 0;
                        if ((flags & 2097155) !== 1) {
                            trackingFlags |= FS.tracking.openFlags.READ;
                        }
                        if ((flags & 2097155) !== 0) {
                            trackingFlags |= FS.tracking.openFlags.WRITE;
                        }
                        FS.trackingDelegate['onOpenFile'](path, trackingFlags);
                    }
                } catch (e) {
                    err(
                        "FS.trackingDelegate['onOpenFile']('" +
                            path +
                            "', flags) threw an exception: " +
                            e.message,
                    );
                }
                return stream;
            },
            close: function (stream) {
                if (FS.isClosed(stream)) {
                    throw new FS.ErrnoError(8);
                }
                if (stream.getdents) stream.getdents = null;
                try {
                    if (stream.stream_ops.close) {
                        stream.stream_ops.close(stream);
                    }
                } catch (e) {
                    throw e;
                } finally {
                    FS.closeStream(stream.fd);
                }
                stream.fd = null;
            },
            isClosed: function (stream) {
                return stream.fd === null;
            },
            llseek: function (stream, offset, whence) {
                if (FS.isClosed(stream)) {
                    throw new FS.ErrnoError(8);
                }
                if (!stream.seekable || !stream.stream_ops.llseek) {
                    throw new FS.ErrnoError(70);
                }
                if (whence != 0 && whence != 1 && whence != 2) {
                    throw new FS.ErrnoError(28);
                }
                stream.position = stream.stream_ops.llseek(
                    stream,
                    offset,
                    whence,
                );
                stream.ungotten = [];
                return stream.position;
            },
            read: function (stream, buffer, offset, length, position) {
                if (length < 0 || position < 0) {
                    throw new FS.ErrnoError(28);
                }
                if (FS.isClosed(stream)) {
                    throw new FS.ErrnoError(8);
                }
                if ((stream.flags & 2097155) === 1) {
                    throw new FS.ErrnoError(8);
                }
                if (FS.isDir(stream.node.mode)) {
                    throw new FS.ErrnoError(31);
                }
                if (!stream.stream_ops.read) {
                    throw new FS.ErrnoError(28);
                }
                var seeking = typeof position !== 'undefined';
                if (!seeking) {
                    position = stream.position;
                } else if (!stream.seekable) {
                    throw new FS.ErrnoError(70);
                }
                var bytesRead = stream.stream_ops.read(
                    stream,
                    buffer,
                    offset,
                    length,
                    position,
                );
                if (!seeking) stream.position += bytesRead;
                return bytesRead;
            },
            write: function (stream, buffer, offset, length, position, canOwn) {
                if (length < 0 || position < 0) {
                    throw new FS.ErrnoError(28);
                }
                if (FS.isClosed(stream)) {
                    throw new FS.ErrnoError(8);
                }
                if ((stream.flags & 2097155) === 0) {
                    throw new FS.ErrnoError(8);
                }
                if (FS.isDir(stream.node.mode)) {
                    throw new FS.ErrnoError(31);
                }
                if (!stream.stream_ops.write) {
                    throw new FS.ErrnoError(28);
                }
                if (stream.seekable && stream.flags & 1024) {
                    FS.llseek(stream, 0, 2);
                }
                var seeking = typeof position !== 'undefined';
                if (!seeking) {
                    position = stream.position;
                } else if (!stream.seekable) {
                    throw new FS.ErrnoError(70);
                }
                var bytesWritten = stream.stream_ops.write(
                    stream,
                    buffer,
                    offset,
                    length,
                    position,
                    canOwn,
                );
                if (!seeking) stream.position += bytesWritten;
                try {
                    if (stream.path && FS.trackingDelegate['onWriteToFile'])
                        FS.trackingDelegate['onWriteToFile'](stream.path);
                } catch (e) {
                    err(
                        "FS.trackingDelegate['onWriteToFile']('" +
                            stream.path +
                            "') threw an exception: " +
                            e.message,
                    );
                }
                return bytesWritten;
            },
            allocate: function (stream, offset, length) {
                if (FS.isClosed(stream)) {
                    throw new FS.ErrnoError(8);
                }
                if (offset < 0 || length <= 0) {
                    throw new FS.ErrnoError(28);
                }
                if ((stream.flags & 2097155) === 0) {
                    throw new FS.ErrnoError(8);
                }
                if (
                    !FS.isFile(stream.node.mode) &&
                    !FS.isDir(stream.node.mode)
                ) {
                    throw new FS.ErrnoError(43);
                }
                if (!stream.stream_ops.allocate) {
                    throw new FS.ErrnoError(138);
                }
                stream.stream_ops.allocate(stream, offset, length);
            },
            mmap: function (stream, address, length, position, prot, flags) {
                if (
                    (prot & 2) !== 0 &&
                    (flags & 2) === 0 &&
                    (stream.flags & 2097155) !== 2
                ) {
                    throw new FS.ErrnoError(2);
                }
                if ((stream.flags & 2097155) === 1) {
                    throw new FS.ErrnoError(2);
                }
                if (!stream.stream_ops.mmap) {
                    throw new FS.ErrnoError(43);
                }
                return stream.stream_ops.mmap(
                    stream,
                    address,
                    length,
                    position,
                    prot,
                    flags,
                );
            },
            msync: function (stream, buffer, offset, length, mmapFlags) {
                if (!stream || !stream.stream_ops.msync) {
                    return 0;
                }
                return stream.stream_ops.msync(
                    stream,
                    buffer,
                    offset,
                    length,
                    mmapFlags,
                );
            },
            munmap: function (stream) {
                return 0;
            },
            ioctl: function (stream, cmd, arg) {
                if (!stream.stream_ops.ioctl) {
                    throw new FS.ErrnoError(59);
                }
                return stream.stream_ops.ioctl(stream, cmd, arg);
            },
            readFile: function (path, opts) {
                opts = opts || {};
                opts.flags = opts.flags || 0;
                opts.encoding = opts.encoding || 'binary';
                if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
                    throw new Error(
                        'Invalid encoding type "' + opts.encoding + '"',
                    );
                }
                var ret;
                var stream = FS.open(path, opts.flags);
                var stat = FS.stat(path);
                var length = stat.size;
                var buf = new Uint8Array(length);
                FS.read(stream, buf, 0, length, 0);
                if (opts.encoding === 'utf8') {
                    ret = UTF8ArrayToString(buf, 0);
                } else if (opts.encoding === 'binary') {
                    ret = buf;
                }
                FS.close(stream);
                return ret;
            },
            writeFile: function (path, data, opts) {
                opts = opts || {};
                opts.flags = opts.flags || 577;
                var stream = FS.open(path, opts.flags, opts.mode);
                if (typeof data === 'string') {
                    var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
                    var actualNumBytes = stringToUTF8Array(
                        data,
                        buf,
                        0,
                        buf.length,
                    );
                    FS.write(
                        stream,
                        buf,
                        0,
                        actualNumBytes,
                        undefined,
                        opts.canOwn,
                    );
                } else if (ArrayBuffer.isView(data)) {
                    FS.write(
                        stream,
                        data,
                        0,
                        data.byteLength,
                        undefined,
                        opts.canOwn,
                    );
                } else {
                    throw new Error('Unsupported data type');
                }
                FS.close(stream);
            },
            cwd: function () {
                return FS.currentPath;
            },
            chdir: function (path) {
                var lookup = FS.lookupPath(path, { follow: true });
                if (lookup.node === null) {
                    throw new FS.ErrnoError(44);
                }
                if (!FS.isDir(lookup.node.mode)) {
                    throw new FS.ErrnoError(54);
                }
                var errCode = FS.nodePermissions(lookup.node, 'x');
                if (errCode) {
                    throw new FS.ErrnoError(errCode);
                }
                FS.currentPath = lookup.path;
            },
            createDefaultDirectories: function () {
                FS.mkdir('/tmp');
                FS.mkdir('/home');
                FS.mkdir('/home/web_user');
            },
            createDefaultDevices: function () {
                FS.mkdir('/dev');
                FS.registerDevice(FS.makedev(1, 3), {
                    read: function () {
                        return 0;
                    },
                    write: function (stream, buffer, offset, length, pos) {
                        return length;
                    },
                });
                FS.mkdev('/dev/null', FS.makedev(1, 3));
                TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
                TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
                FS.mkdev('/dev/tty', FS.makedev(5, 0));
                FS.mkdev('/dev/tty1', FS.makedev(6, 0));
                var random_device = getRandomDevice();
                FS.createDevice('/dev', 'random', random_device);
                FS.createDevice('/dev', 'urandom', random_device);
                FS.mkdir('/dev/shm');
                FS.mkdir('/dev/shm/tmp');
            },
            createSpecialDirectories: function () {
                FS.mkdir('/proc');
                var proc_self = FS.mkdir('/proc/self');
                FS.mkdir('/proc/self/fd');
                FS.mount(
                    {
                        mount: function () {
                            var node = FS.createNode(
                                proc_self,
                                'fd',
                                16384 | 511,
                                73,
                            );
                            node.node_ops = {
                                lookup: function (parent, name) {
                                    var fd = +name;
                                    var stream = FS.getStream(fd);
                                    if (!stream) throw new FS.ErrnoError(8);
                                    var ret = {
                                        parent: null,
                                        mount: { mountpoint: 'fake' },
                                        node_ops: {
                                            readlink: function () {
                                                return stream.path;
                                            },
                                        },
                                    };
                                    ret.parent = ret;
                                    return ret;
                                },
                            };
                            return node;
                        },
                    },
                    {},
                    '/proc/self/fd',
                );
            },
            createStandardStreams: function () {
                if (Module['stdin']) {
                    FS.createDevice('/dev', 'stdin', Module['stdin']);
                } else {
                    FS.symlink('/dev/tty', '/dev/stdin');
                }
                if (Module['stdout']) {
                    FS.createDevice('/dev', 'stdout', null, Module['stdout']);
                } else {
                    FS.symlink('/dev/tty', '/dev/stdout');
                }
                if (Module['stderr']) {
                    FS.createDevice('/dev', 'stderr', null, Module['stderr']);
                } else {
                    FS.symlink('/dev/tty1', '/dev/stderr');
                }
                var stdin = FS.open('/dev/stdin', 0);
                var stdout = FS.open('/dev/stdout', 1);
                var stderr = FS.open('/dev/stderr', 1);
            },
            ensureErrnoError: function () {
                if (FS.ErrnoError) return;
                FS.ErrnoError = function ErrnoError(errno, node) {
                    this.node = node;
                    this.setErrno = function (errno) {
                        this.errno = errno;
                    };
                    this.setErrno(errno);
                    this.message = 'FS error';
                };
                FS.ErrnoError.prototype = new Error();
                FS.ErrnoError.prototype.constructor = FS.ErrnoError;
                [44].forEach(function (code) {
                    FS.genericErrors[code] = new FS.ErrnoError(code);
                    FS.genericErrors[code].stack = '<generic error, no stack>';
                });
            },
            staticInit: function () {
                FS.ensureErrnoError();
                FS.nameTable = new Array(4096);
                FS.mount(MEMFS, {}, '/');
                FS.createDefaultDirectories();
                FS.createDefaultDevices();
                FS.createSpecialDirectories();
                FS.filesystems = { MEMFS: MEMFS };
            },
            init: function (input, output, error) {
                FS.init.initialized = true;
                FS.ensureErrnoError();
                Module['stdin'] = input || Module['stdin'];
                Module['stdout'] = output || Module['stdout'];
                Module['stderr'] = error || Module['stderr'];
                FS.createStandardStreams();
            },
            quit: function () {
                FS.init.initialized = false;
                var fflush = Module['_fflush'];
                if (fflush) fflush(0);
                for (var i = 0; i < FS.streams.length; i++) {
                    var stream = FS.streams[i];
                    if (!stream) {
                        continue;
                    }
                    FS.close(stream);
                }
            },
            getMode: function (canRead, canWrite) {
                var mode = 0;
                if (canRead) mode |= 292 | 73;
                if (canWrite) mode |= 146;
                return mode;
            },
            findObject: function (path, dontResolveLastLink) {
                var ret = FS.analyzePath(path, dontResolveLastLink);
                if (ret.exists) {
                    return ret.object;
                } else {
                    return null;
                }
            },
            analyzePath: function (path, dontResolveLastLink) {
                try {
                    var lookup = FS.lookupPath(path, {
                        follow: !dontResolveLastLink,
                    });
                    path = lookup.path;
                } catch (e) {}
                var ret = {
                    isRoot: false,
                    exists: false,
                    error: 0,
                    name: null,
                    path: null,
                    object: null,
                    parentExists: false,
                    parentPath: null,
                    parentObject: null,
                };
                try {
                    var lookup = FS.lookupPath(path, { parent: true });
                    ret.parentExists = true;
                    ret.parentPath = lookup.path;
                    ret.parentObject = lookup.node;
                    ret.name = PATH.basename(path);
                    lookup = FS.lookupPath(path, {
                        follow: !dontResolveLastLink,
                    });
                    ret.exists = true;
                    ret.path = lookup.path;
                    ret.object = lookup.node;
                    ret.name = lookup.node.name;
                    ret.isRoot = lookup.path === '/';
                } catch (e) {
                    ret.error = e.errno;
                }
                return ret;
            },
            createPath: function (parent, path, canRead, canWrite) {
                parent =
                    typeof parent === 'string' ? parent : FS.getPath(parent);
                var parts = path.split('/').reverse();
                while (parts.length) {
                    var part = parts.pop();
                    if (!part) continue;
                    var current = PATH.join2(parent, part);
                    try {
                        FS.mkdir(current);
                    } catch (e) {}
                    parent = current;
                }
                return current;
            },
            createFile: function (parent, name, properties, canRead, canWrite) {
                var path = PATH.join2(
                    typeof parent === 'string' ? parent : FS.getPath(parent),
                    name,
                );
                var mode = FS.getMode(canRead, canWrite);
                return FS.create(path, mode);
            },
            createDataFile: function (
                parent,
                name,
                data,
                canRead,
                canWrite,
                canOwn,
            ) {
                var path = name
                    ? PATH.join2(
                          typeof parent === 'string'
                              ? parent
                              : FS.getPath(parent),
                          name,
                      )
                    : parent;
                var mode = FS.getMode(canRead, canWrite);
                var node = FS.create(path, mode);
                if (data) {
                    if (typeof data === 'string') {
                        var arr = new Array(data.length);
                        for (var i = 0, len = data.length; i < len; ++i)
                            arr[i] = data.charCodeAt(i);
                        data = arr;
                    }
                    FS.chmod(node, mode | 146);
                    var stream = FS.open(node, 577);
                    FS.write(stream, data, 0, data.length, 0, canOwn);
                    FS.close(stream);
                    FS.chmod(node, mode);
                }
                return node;
            },
            createDevice: function (parent, name, input, output) {
                var path = PATH.join2(
                    typeof parent === 'string' ? parent : FS.getPath(parent),
                    name,
                );
                var mode = FS.getMode(!!input, !!output);
                if (!FS.createDevice.major) FS.createDevice.major = 64;
                var dev = FS.makedev(FS.createDevice.major++, 0);
                FS.registerDevice(dev, {
                    open: function (stream) {
                        stream.seekable = false;
                    },
                    close: function (stream) {
                        if (output && output.buffer && output.buffer.length) {
                            output(10);
                        }
                    },
                    read: function (stream, buffer, offset, length, pos) {
                        var bytesRead = 0;
                        for (var i = 0; i < length; i++) {
                            var result;
                            try {
                                result = input();
                            } catch (e) {
                                throw new FS.ErrnoError(29);
                            }
                            if (result === undefined && bytesRead === 0) {
                                throw new FS.ErrnoError(6);
                            }
                            if (result === null || result === undefined) break;
                            bytesRead++;
                            buffer[offset + i] = result;
                        }
                        if (bytesRead) {
                            stream.node.timestamp = Date.now();
                        }
                        return bytesRead;
                    },
                    write: function (stream, buffer, offset, length, pos) {
                        for (var i = 0; i < length; i++) {
                            try {
                                output(buffer[offset + i]);
                            } catch (e) {
                                throw new FS.ErrnoError(29);
                            }
                        }
                        if (length) {
                            stream.node.timestamp = Date.now();
                        }
                        return i;
                    },
                });
                return FS.mkdev(path, mode, dev);
            },
            forceLoadFile: function (obj) {
                if (obj.isDevice || obj.isFolder || obj.link || obj.contents)
                    return true;
                if (typeof XMLHttpRequest !== 'undefined') {
                    throw new Error(
                        'Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.',
                    );
                } else if (read_) {
                    try {
                        obj.contents = intArrayFromString(read_(obj.url), true);
                        obj.usedBytes = obj.contents.length;
                    } catch (e) {
                        throw new FS.ErrnoError(29);
                    }
                } else {
                    throw new Error(
                        'Cannot load without read() or XMLHttpRequest.',
                    );
                }
            },
            createLazyFile: function (parent, name, url, canRead, canWrite) {
                function LazyUint8Array() {
                    this.lengthKnown = false;
                    this.chunks = [];
                }
                LazyUint8Array.prototype.get = function LazyUint8Array_get(
                    idx,
                ) {
                    if (idx > this.length - 1 || idx < 0) {
                        return undefined;
                    }
                    var chunkOffset = idx % this.chunkSize;
                    var chunkNum = (idx / this.chunkSize) | 0;
                    return this.getter(chunkNum)[chunkOffset];
                };
                LazyUint8Array.prototype.setDataGetter =
                    function LazyUint8Array_setDataGetter(getter) {
                        this.getter = getter;
                    };
                LazyUint8Array.prototype.cacheLength =
                    function LazyUint8Array_cacheLength() {
                        var xhr = new XMLHttpRequest();
                        xhr.open('HEAD', url, false);
                        xhr.send(null);
                        if (
                            !(
                                (xhr.status >= 200 && xhr.status < 300) ||
                                xhr.status === 304
                            )
                        )
                            throw new Error(
                                "Couldn't load " +
                                    url +
                                    '. Status: ' +
                                    xhr.status,
                            );
                        var datalength = Number(
                            xhr.getResponseHeader('Content-length'),
                        );
                        var header;
                        var hasByteServing =
                            (header = xhr.getResponseHeader('Accept-Ranges')) &&
                            header === 'bytes';
                        var usesGzip =
                            (header =
                                xhr.getResponseHeader('Content-Encoding')) &&
                            header === 'gzip';
                        var chunkSize = 1024 * 1024;
                        if (!hasByteServing) chunkSize = datalength;
                        var doXHR = function (from, to) {
                            if (from > to)
                                throw new Error(
                                    'invalid range (' +
                                        from +
                                        ', ' +
                                        to +
                                        ') or no bytes requested!',
                                );
                            if (to > datalength - 1)
                                throw new Error(
                                    'only ' +
                                        datalength +
                                        ' bytes available! programmer error!',
                                );
                            var xhr = new XMLHttpRequest();
                            xhr.open('GET', url, false);
                            if (datalength !== chunkSize)
                                xhr.setRequestHeader(
                                    'Range',
                                    'bytes=' + from + '-' + to,
                                );
                            if (typeof Uint8Array != 'undefined')
                                xhr.responseType = 'arraybuffer';
                            if (xhr.overrideMimeType) {
                                xhr.overrideMimeType(
                                    'text/plain; charset=x-user-defined',
                                );
                            }
                            xhr.send(null);
                            if (
                                !(
                                    (xhr.status >= 200 && xhr.status < 300) ||
                                    xhr.status === 304
                                )
                            )
                                throw new Error(
                                    "Couldn't load " +
                                        url +
                                        '. Status: ' +
                                        xhr.status,
                                );
                            if (xhr.response !== undefined) {
                                return new Uint8Array(xhr.response || []);
                            } else {
                                return intArrayFromString(
                                    xhr.responseText || '',
                                    true,
                                );
                            }
                        };
                        var lazyArray = this;
                        lazyArray.setDataGetter(function (chunkNum) {
                            var start = chunkNum * chunkSize;
                            var end = (chunkNum + 1) * chunkSize - 1;
                            end = Math.min(end, datalength - 1);
                            if (
                                typeof lazyArray.chunks[chunkNum] ===
                                'undefined'
                            ) {
                                lazyArray.chunks[chunkNum] = doXHR(start, end);
                            }
                            if (
                                typeof lazyArray.chunks[chunkNum] ===
                                'undefined'
                            )
                                throw new Error('doXHR failed!');
                            return lazyArray.chunks[chunkNum];
                        });
                        if (usesGzip || !datalength) {
                            chunkSize = datalength = 1;
                            datalength = this.getter(0).length;
                            chunkSize = datalength;
                            out(
                                'LazyFiles on gzip forces download of the whole file when length is accessed',
                            );
                        }
                        this._length = datalength;
                        this._chunkSize = chunkSize;
                        this.lengthKnown = true;
                    };
                if (typeof XMLHttpRequest !== 'undefined') {
                    if (!ENVIRONMENT_IS_WORKER)
                        throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
                    var lazyArray = new LazyUint8Array();
                    Object.defineProperties(lazyArray, {
                        length: {
                            get: function () {
                                if (!this.lengthKnown) {
                                    this.cacheLength();
                                }
                                return this._length;
                            },
                        },
                        chunkSize: {
                            get: function () {
                                if (!this.lengthKnown) {
                                    this.cacheLength();
                                }
                                return this._chunkSize;
                            },
                        },
                    });
                    var properties = { isDevice: false, contents: lazyArray };
                } else {
                    var properties = { isDevice: false, url: url };
                }
                var node = FS.createFile(
                    parent,
                    name,
                    properties,
                    canRead,
                    canWrite,
                );
                if (properties.contents) {
                    node.contents = properties.contents;
                } else if (properties.url) {
                    node.contents = null;
                    node.url = properties.url;
                }
                Object.defineProperties(node, {
                    usedBytes: {
                        get: function () {
                            return this.contents.length;
                        },
                    },
                });
                var stream_ops = {};
                var keys = Object.keys(node.stream_ops);
                keys.forEach(function (key) {
                    var fn = node.stream_ops[key];
                    stream_ops[key] = function forceLoadLazyFile() {
                        FS.forceLoadFile(node);
                        return fn.apply(null, arguments);
                    };
                });
                stream_ops.read = function stream_ops_read(
                    stream,
                    buffer,
                    offset,
                    length,
                    position,
                ) {
                    FS.forceLoadFile(node);
                    var contents = stream.node.contents;
                    if (position >= contents.length) return 0;
                    var size = Math.min(contents.length - position, length);
                    if (contents.slice) {
                        for (var i = 0; i < size; i++) {
                            buffer[offset + i] = contents[position + i];
                        }
                    } else {
                        for (var i = 0; i < size; i++) {
                            buffer[offset + i] = contents.get(position + i);
                        }
                    }
                    return size;
                };
                node.stream_ops = stream_ops;
                return node;
            },
            createPreloadedFile: function (
                parent,
                name,
                url,
                canRead,
                canWrite,
                onload,
                onerror,
                dontCreateFile,
                canOwn,
                preFinish,
            ) {
                Browser.init();
                var fullname = name
                    ? PATH_FS.resolve(PATH.join2(parent, name))
                    : parent;
                var dep = getUniqueRunDependency('cp ' + fullname);
                function processData(byteArray) {
                    function finish(byteArray) {
                        if (preFinish) preFinish();
                        if (!dontCreateFile) {
                            FS.createDataFile(
                                parent,
                                name,
                                byteArray,
                                canRead,
                                canWrite,
                                canOwn,
                            );
                        }
                        if (onload) onload();
                        removeRunDependency(dep);
                    }
                    var handled = false;
                    Module['preloadPlugins'].forEach(function (plugin) {
                        if (handled) return;
                        if (plugin['canHandle'](fullname)) {
                            plugin['handle'](
                                byteArray,
                                fullname,
                                finish,
                                function () {
                                    if (onerror) onerror();
                                    removeRunDependency(dep);
                                },
                            );
                            handled = true;
                        }
                    });
                    if (!handled) finish(byteArray);
                }
                addRunDependency(dep);
                if (typeof url == 'string') {
                    Browser.asyncLoad(
                        url,
                        function (byteArray) {
                            processData(byteArray);
                        },
                        onerror,
                    );
                } else {
                    processData(url);
                }
            },
            indexedDB: function () {
                return (
                    window.indexedDB ||
                    window.mozIndexedDB ||
                    window.webkitIndexedDB ||
                    window.msIndexedDB
                );
            },
            DB_NAME: function () {
                return 'EM_FS_' + window.location.pathname;
            },
            DB_VERSION: 20,
            DB_STORE_NAME: 'FILE_DATA',
            saveFilesToDB: function (paths, onload, onerror) {
                onload = onload || function () {};
                onerror = onerror || function () {};
                var indexedDB = FS.indexedDB();
                try {
                    var openRequest = indexedDB.open(
                        FS.DB_NAME(),
                        FS.DB_VERSION,
                    );
                } catch (e) {
                    return onerror(e);
                }
                openRequest.onupgradeneeded =
                    function openRequest_onupgradeneeded() {
                        out('creating db');
                        var db = openRequest.result;
                        db.createObjectStore(FS.DB_STORE_NAME);
                    };
                openRequest.onsuccess = function openRequest_onsuccess() {
                    var db = openRequest.result;
                    var transaction = db.transaction(
                        [FS.DB_STORE_NAME],
                        'readwrite',
                    );
                    var files = transaction.objectStore(FS.DB_STORE_NAME);
                    var ok = 0,
                        fail = 0,
                        total = paths.length;
                    function finish() {
                        if (fail == 0) onload();
                        else onerror();
                    }
                    paths.forEach(function (path) {
                        var putRequest = files.put(
                            FS.analyzePath(path).object.contents,
                            path,
                        );
                        putRequest.onsuccess = function putRequest_onsuccess() {
                            ok++;
                            if (ok + fail == total) finish();
                        };
                        putRequest.onerror = function putRequest_onerror() {
                            fail++;
                            if (ok + fail == total) finish();
                        };
                    });
                    transaction.onerror = onerror;
                };
                openRequest.onerror = onerror;
            },
            loadFilesFromDB: function (paths, onload, onerror) {
                onload = onload || function () {};
                onerror = onerror || function () {};
                var indexedDB = FS.indexedDB();
                try {
                    var openRequest = indexedDB.open(
                        FS.DB_NAME(),
                        FS.DB_VERSION,
                    );
                } catch (e) {
                    return onerror(e);
                }
                openRequest.onupgradeneeded = onerror;
                openRequest.onsuccess = function openRequest_onsuccess() {
                    var db = openRequest.result;
                    try {
                        var transaction = db.transaction(
                            [FS.DB_STORE_NAME],
                            'readonly',
                        );
                    } catch (e) {
                        onerror(e);
                        return;
                    }
                    var files = transaction.objectStore(FS.DB_STORE_NAME);
                    var ok = 0,
                        fail = 0,
                        total = paths.length;
                    function finish() {
                        if (fail == 0) onload();
                        else onerror();
                    }
                    paths.forEach(function (path) {
                        var getRequest = files.get(path);
                        getRequest.onsuccess = function getRequest_onsuccess() {
                            if (FS.analyzePath(path).exists) {
                                FS.unlink(path);
                            }
                            FS.createDataFile(
                                PATH.dirname(path),
                                PATH.basename(path),
                                getRequest.result,
                                true,
                                true,
                                true,
                            );
                            ok++;
                            if (ok + fail == total) finish();
                        };
                        getRequest.onerror = function getRequest_onerror() {
                            fail++;
                            if (ok + fail == total) finish();
                        };
                    });
                    transaction.onerror = onerror;
                };
                openRequest.onerror = onerror;
            },
        };
        var SYSCALLS = {
            mappings: {},
            DEFAULT_POLLMASK: 5,
            umask: 511,
            calculateAt: function (dirfd, path, allowEmpty) {
                if (path[0] === '/') {
                    return path;
                }
                var dir;
                if (dirfd === -100) {
                    dir = FS.cwd();
                } else {
                    var dirstream = FS.getStream(dirfd);
                    if (!dirstream) throw new FS.ErrnoError(8);
                    dir = dirstream.path;
                }
                if (path.length == 0) {
                    if (!allowEmpty) {
                        throw new FS.ErrnoError(44);
                    }
                    return dir;
                }
                return PATH.join2(dir, path);
            },
            doStat: function (func, path, buf) {
                try {
                    var stat = func(path);
                } catch (e) {
                    if (
                        e &&
                        e.node &&
                        PATH.normalize(path) !==
                            PATH.normalize(FS.getPath(e.node))
                    ) {
                        return -54;
                    }
                    throw e;
                }
                HEAP32[buf >> 2] = stat.dev;
                HEAP32[(buf + 4) >> 2] = 0;
                HEAP32[(buf + 8) >> 2] = stat.ino;
                HEAP32[(buf + 12) >> 2] = stat.mode;
                HEAP32[(buf + 16) >> 2] = stat.nlink;
                HEAP32[(buf + 20) >> 2] = stat.uid;
                HEAP32[(buf + 24) >> 2] = stat.gid;
                HEAP32[(buf + 28) >> 2] = stat.rdev;
                HEAP32[(buf + 32) >> 2] = 0;
                ((tempI64 = [
                    stat.size >>> 0,
                    ((tempDouble = stat.size),
                    +Math.abs(tempDouble) >= 1
                        ? tempDouble > 0
                            ? (Math.min(
                                  +Math.floor(tempDouble / 4294967296),
                                  4294967295,
                              ) |
                                  0) >>>
                              0
                            : ~~+Math.ceil(
                                  (tempDouble - +(~~tempDouble >>> 0)) /
                                      4294967296,
                              ) >>> 0
                        : 0),
                ]),
                    (HEAP32[(buf + 40) >> 2] = tempI64[0]),
                    (HEAP32[(buf + 44) >> 2] = tempI64[1]));
                HEAP32[(buf + 48) >> 2] = 4096;
                HEAP32[(buf + 52) >> 2] = stat.blocks;
                HEAP32[(buf + 56) >> 2] = (stat.atime.getTime() / 1e3) | 0;
                HEAP32[(buf + 60) >> 2] = 0;
                HEAP32[(buf + 64) >> 2] = (stat.mtime.getTime() / 1e3) | 0;
                HEAP32[(buf + 68) >> 2] = 0;
                HEAP32[(buf + 72) >> 2] = (stat.ctime.getTime() / 1e3) | 0;
                HEAP32[(buf + 76) >> 2] = 0;
                ((tempI64 = [
                    stat.ino >>> 0,
                    ((tempDouble = stat.ino),
                    +Math.abs(tempDouble) >= 1
                        ? tempDouble > 0
                            ? (Math.min(
                                  +Math.floor(tempDouble / 4294967296),
                                  4294967295,
                              ) |
                                  0) >>>
                              0
                            : ~~+Math.ceil(
                                  (tempDouble - +(~~tempDouble >>> 0)) /
                                      4294967296,
                              ) >>> 0
                        : 0),
                ]),
                    (HEAP32[(buf + 80) >> 2] = tempI64[0]),
                    (HEAP32[(buf + 84) >> 2] = tempI64[1]));
                return 0;
            },
            doMsync: function (addr, stream, len, flags, offset) {
                var buffer = HEAPU8.slice(addr, addr + len);
                FS.msync(stream, buffer, offset, len, flags);
            },
            doMkdir: function (path, mode) {
                path = PATH.normalize(path);
                if (path[path.length - 1] === '/')
                    path = path.substr(0, path.length - 1);
                FS.mkdir(path, mode, 0);
                return 0;
            },
            doMknod: function (path, mode, dev) {
                switch (mode & 61440) {
                    case 32768:
                    case 8192:
                    case 24576:
                    case 4096:
                    case 49152:
                        break;
                    default:
                        return -28;
                }
                FS.mknod(path, mode, dev);
                return 0;
            },
            doReadlink: function (path, buf, bufsize) {
                if (bufsize <= 0) return -28;
                var ret = FS.readlink(path);
                var len = Math.min(bufsize, lengthBytesUTF8(ret));
                var endChar = HEAP8[buf + len];
                stringToUTF8(ret, buf, bufsize + 1);
                HEAP8[buf + len] = endChar;
                return len;
            },
            doAccess: function (path, amode) {
                if (amode & ~7) {
                    return -28;
                }
                var node;
                var lookup = FS.lookupPath(path, { follow: true });
                node = lookup.node;
                if (!node) {
                    return -44;
                }
                var perms = '';
                if (amode & 4) perms += 'r';
                if (amode & 2) perms += 'w';
                if (amode & 1) perms += 'x';
                if (perms && FS.nodePermissions(node, perms)) {
                    return -2;
                }
                return 0;
            },
            doDup: function (path, flags, suggestFD) {
                var suggest = FS.getStream(suggestFD);
                if (suggest) FS.close(suggest);
                return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
            },
            doReadv: function (stream, iov, iovcnt, offset) {
                var ret = 0;
                for (var i = 0; i < iovcnt; i++) {
                    var ptr = HEAP32[(iov + i * 8) >> 2];
                    var len = HEAP32[(iov + (i * 8 + 4)) >> 2];
                    var curr = FS.read(stream, HEAP8, ptr, len, offset);
                    if (curr < 0) return -1;
                    ret += curr;
                    if (curr < len) break;
                }
                return ret;
            },
            doWritev: function (stream, iov, iovcnt, offset) {
                var ret = 0;
                for (var i = 0; i < iovcnt; i++) {
                    var ptr = HEAP32[(iov + i * 8) >> 2];
                    var len = HEAP32[(iov + (i * 8 + 4)) >> 2];
                    var curr = FS.write(stream, HEAP8, ptr, len, offset);
                    if (curr < 0) return -1;
                    ret += curr;
                }
                return ret;
            },
            varargs: undefined,
            get: function () {
                SYSCALLS.varargs += 4;
                var ret = HEAP32[(SYSCALLS.varargs - 4) >> 2];
                return ret;
            },
            getStr: function (ptr) {
                var ret = UTF8ToString(ptr);
                return ret;
            },
            getStreamFromFD: function (fd) {
                var stream = FS.getStream(fd);
                if (!stream) throw new FS.ErrnoError(8);
                return stream;
            },
            get64: function (low, high) {
                return low;
            },
        };
        function ___sys_fcntl64(fd, cmd, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var stream = SYSCALLS.getStreamFromFD(fd);
                switch (cmd) {
                    case 0: {
                        var arg = SYSCALLS.get();
                        if (arg < 0) {
                            return -28;
                        }
                        var newStream;
                        newStream = FS.open(stream.path, stream.flags, 0, arg);
                        return newStream.fd;
                    }
                    case 1:
                    case 2:
                        return 0;
                    case 3:
                        return stream.flags;
                    case 4: {
                        var arg = SYSCALLS.get();
                        stream.flags |= arg;
                        return 0;
                    }
                    case 12: {
                        var arg = SYSCALLS.get();
                        var offset = 0;
                        HEAP16[(arg + offset) >> 1] = 2;
                        return 0;
                    }
                    case 13:
                    case 14:
                        return 0;
                    case 16:
                    case 8:
                        return -28;
                    case 9:
                        setErrNo(28);
                        return -1;
                    default: {
                        return -28;
                    }
                }
            } catch (e) {
                if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError))
                    abort(e);
                return -e.errno;
            }
        }
        function ___sys_ioctl(fd, op, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var stream = SYSCALLS.getStreamFromFD(fd);
                switch (op) {
                    case 21509:
                    case 21505: {
                        if (!stream.tty) return -59;
                        return 0;
                    }
                    case 21510:
                    case 21511:
                    case 21512:
                    case 21506:
                    case 21507:
                    case 21508: {
                        if (!stream.tty) return -59;
                        return 0;
                    }
                    case 21519: {
                        if (!stream.tty) return -59;
                        var argp = SYSCALLS.get();
                        HEAP32[argp >> 2] = 0;
                        return 0;
                    }
                    case 21520: {
                        if (!stream.tty) return -59;
                        return -28;
                    }
                    case 21531: {
                        var argp = SYSCALLS.get();
                        return FS.ioctl(stream, op, argp);
                    }
                    case 21523: {
                        if (!stream.tty) return -59;
                        return 0;
                    }
                    case 21524: {
                        if (!stream.tty) return -59;
                        return 0;
                    }
                    default:
                        abort('bad ioctl syscall ' + op);
                }
            } catch (e) {
                if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError))
                    abort(e);
                return -e.errno;
            }
        }
        function ___sys_open(path, flags, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var pathname = SYSCALLS.getStr(path);
                var mode = varargs ? SYSCALLS.get() : 0;
                var stream = FS.open(pathname, flags, mode);
                return stream.fd;
            } catch (e) {
                if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError))
                    abort(e);
                return -e.errno;
            }
        }
        function __embind_register_bigint(
            primitiveType,
            name,
            size,
            minRange,
            maxRange,
        ) {}
        function getShiftFromSize(size) {
            switch (size) {
                case 1:
                    return 0;
                case 2:
                    return 1;
                case 4:
                    return 2;
                case 8:
                    return 3;
                default:
                    throw new TypeError('Unknown type size: ' + size);
            }
        }
        function embind_init_charCodes() {
            var codes = new Array(256);
            for (var i = 0; i < 256; ++i) {
                codes[i] = String.fromCharCode(i);
            }
            embind_charCodes = codes;
        }
        var embind_charCodes = undefined;
        function readLatin1String(ptr) {
            var ret = '';
            var c = ptr;
            while (HEAPU8[c]) {
                ret += embind_charCodes[HEAPU8[c++]];
            }
            return ret;
        }
        var awaitingDependencies = {};
        var registeredTypes = {};
        var typeDependencies = {};
        var char_0 = 48;
        var char_9 = 57;
        function makeLegalFunctionName(name) {
            if (undefined === name) {
                return '_unknown';
            }
            name = name.replace(/[^a-zA-Z0-9_]/g, '$');
            var f = name.charCodeAt(0);
            if (f >= char_0 && f <= char_9) {
                return '_' + name;
            } else {
                return name;
            }
        }
        function createNamedFunction(name, body) {
            name = makeLegalFunctionName(name);
            return new Function(
                'body',
                'return function ' +
                    name +
                    '() {\n' +
                    '    "use strict";' +
                    '    return body.apply(this, arguments);\n' +
                    '};\n',
            )(body);
        }
        function extendError(baseErrorType, errorName) {
            var errorClass = createNamedFunction(errorName, function (message) {
                this.name = errorName;
                this.message = message;
                var stack = new Error(message).stack;
                if (stack !== undefined) {
                    this.stack =
                        this.toString() +
                        '\n' +
                        stack.replace(/^Error(:[^\n]*)?\n/, '');
                }
            });
            errorClass.prototype = Object.create(baseErrorType.prototype);
            errorClass.prototype.constructor = errorClass;
            errorClass.prototype.toString = function () {
                if (this.message === undefined) {
                    return this.name;
                } else {
                    return this.name + ': ' + this.message;
                }
            };
            return errorClass;
        }
        var BindingError = undefined;
        function throwBindingError(message) {
            throw new BindingError(message);
        }
        var InternalError = undefined;
        function throwInternalError(message) {
            throw new InternalError(message);
        }
        function whenDependentTypesAreResolved(
            myTypes,
            dependentTypes,
            getTypeConverters,
        ) {
            myTypes.forEach(function (type) {
                typeDependencies[type] = dependentTypes;
            });
            function onComplete(typeConverters) {
                var myTypeConverters = getTypeConverters(typeConverters);
                if (myTypeConverters.length !== myTypes.length) {
                    throwInternalError('Mismatched type converter count');
                }
                for (var i = 0; i < myTypes.length; ++i) {
                    registerType(myTypes[i], myTypeConverters[i]);
                }
            }
            var typeConverters = new Array(dependentTypes.length);
            var unregisteredTypes = [];
            var registered = 0;
            dependentTypes.forEach(function (dt, i) {
                if (registeredTypes.hasOwnProperty(dt)) {
                    typeConverters[i] = registeredTypes[dt];
                } else {
                    unregisteredTypes.push(dt);
                    if (!awaitingDependencies.hasOwnProperty(dt)) {
                        awaitingDependencies[dt] = [];
                    }
                    awaitingDependencies[dt].push(function () {
                        typeConverters[i] = registeredTypes[dt];
                        ++registered;
                        if (registered === unregisteredTypes.length) {
                            onComplete(typeConverters);
                        }
                    });
                }
            });
            if (0 === unregisteredTypes.length) {
                onComplete(typeConverters);
            }
        }
        function registerType(rawType, registeredInstance, options) {
            options = options || {};
            if (!('argPackAdvance' in registeredInstance)) {
                throw new TypeError(
                    'registerType registeredInstance requires argPackAdvance',
                );
            }
            var name = registeredInstance.name;
            if (!rawType) {
                throwBindingError(
                    'type "' +
                        name +
                        '" must have a positive integer typeid pointer',
                );
            }
            if (registeredTypes.hasOwnProperty(rawType)) {
                if (options.ignoreDuplicateRegistrations) {
                    return;
                } else {
                    throwBindingError(
                        "Cannot register type '" + name + "' twice",
                    );
                }
            }
            registeredTypes[rawType] = registeredInstance;
            delete typeDependencies[rawType];
            if (awaitingDependencies.hasOwnProperty(rawType)) {
                var callbacks = awaitingDependencies[rawType];
                delete awaitingDependencies[rawType];
                callbacks.forEach(function (cb) {
                    cb();
                });
            }
        }
        function __embind_register_bool(
            rawType,
            name,
            size,
            trueValue,
            falseValue,
        ) {
            var shift = getShiftFromSize(size);
            name = readLatin1String(name);
            registerType(rawType, {
                name: name,
                fromWireType: function (wt) {
                    return !!wt;
                },
                toWireType: function (destructors, o) {
                    return o ? trueValue : falseValue;
                },
                argPackAdvance: 8,
                readValueFromPointer: function (pointer) {
                    var heap;
                    if (size === 1) {
                        heap = HEAP8;
                    } else if (size === 2) {
                        heap = HEAP16;
                    } else if (size === 4) {
                        heap = HEAP32;
                    } else {
                        throw new TypeError(
                            'Unknown boolean type size: ' + name,
                        );
                    }
                    return this['fromWireType'](heap[pointer >> shift]);
                },
                destructorFunction: null,
            });
        }
        function ClassHandle_isAliasOf(other) {
            if (!(this instanceof ClassHandle)) {
                return false;
            }
            if (!(other instanceof ClassHandle)) {
                return false;
            }
            var leftClass = this.$$.ptrType.registeredClass;
            var left = this.$$.ptr;
            var rightClass = other.$$.ptrType.registeredClass;
            var right = other.$$.ptr;
            while (leftClass.baseClass) {
                left = leftClass.upcast(left);
                leftClass = leftClass.baseClass;
            }
            while (rightClass.baseClass) {
                right = rightClass.upcast(right);
                rightClass = rightClass.baseClass;
            }
            return leftClass === rightClass && left === right;
        }
        function shallowCopyInternalPointer(o) {
            return {
                count: o.count,
                deleteScheduled: o.deleteScheduled,
                preservePointerOnDelete: o.preservePointerOnDelete,
                ptr: o.ptr,
                ptrType: o.ptrType,
                smartPtr: o.smartPtr,
                smartPtrType: o.smartPtrType,
            };
        }
        function throwInstanceAlreadyDeleted(obj) {
            function getInstanceTypeName(handle) {
                return handle.$$.ptrType.registeredClass.name;
            }
            throwBindingError(
                getInstanceTypeName(obj) + ' instance already deleted',
            );
        }
        var finalizationGroup = false;
        function detachFinalizer(handle) {}
        function runDestructor($$) {
            if ($$.smartPtr) {
                $$.smartPtrType.rawDestructor($$.smartPtr);
            } else {
                $$.ptrType.registeredClass.rawDestructor($$.ptr);
            }
        }
        function releaseClassHandle($$) {
            $$.count.value -= 1;
            var toDelete = 0 === $$.count.value;
            if (toDelete) {
                runDestructor($$);
            }
        }
        function attachFinalizer(handle) {
            if ('undefined' === typeof FinalizationGroup) {
                attachFinalizer = function (handle) {
                    return handle;
                };
                return handle;
            }
            finalizationGroup = new FinalizationGroup(function (iter) {
                for (
                    var result = iter.next();
                    !result.done;
                    result = iter.next()
                ) {
                    var $$ = result.value;
                    if (!$$.ptr) {
                        console.warn('object already deleted: ' + $$.ptr);
                    } else {
                        releaseClassHandle($$);
                    }
                }
            });
            attachFinalizer = function (handle) {
                finalizationGroup.register(handle, handle.$$, handle.$$);
                return handle;
            };
            detachFinalizer = function (handle) {
                finalizationGroup.unregister(handle.$$);
            };
            return attachFinalizer(handle);
        }
        function ClassHandle_clone() {
            if (!this.$$.ptr) {
                throwInstanceAlreadyDeleted(this);
            }
            if (this.$$.preservePointerOnDelete) {
                this.$$.count.value += 1;
                return this;
            } else {
                var clone = attachFinalizer(
                    Object.create(Object.getPrototypeOf(this), {
                        $$: { value: shallowCopyInternalPointer(this.$$) },
                    }),
                );
                clone.$$.count.value += 1;
                clone.$$.deleteScheduled = false;
                return clone;
            }
        }
        function ClassHandle_delete() {
            if (!this.$$.ptr) {
                throwInstanceAlreadyDeleted(this);
            }
            if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
                throwBindingError('Object already scheduled for deletion');
            }
            detachFinalizer(this);
            releaseClassHandle(this.$$);
            if (!this.$$.preservePointerOnDelete) {
                this.$$.smartPtr = undefined;
                this.$$.ptr = undefined;
            }
        }
        function ClassHandle_isDeleted() {
            return !this.$$.ptr;
        }
        var delayFunction = undefined;
        var deletionQueue = [];
        function flushPendingDeletes() {
            while (deletionQueue.length) {
                var obj = deletionQueue.pop();
                obj.$$.deleteScheduled = false;
                obj['delete']();
            }
        }
        function ClassHandle_deleteLater() {
            if (!this.$$.ptr) {
                throwInstanceAlreadyDeleted(this);
            }
            if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
                throwBindingError('Object already scheduled for deletion');
            }
            deletionQueue.push(this);
            if (deletionQueue.length === 1 && delayFunction) {
                delayFunction(flushPendingDeletes);
            }
            this.$$.deleteScheduled = true;
            return this;
        }
        function init_ClassHandle() {
            ClassHandle.prototype['isAliasOf'] = ClassHandle_isAliasOf;
            ClassHandle.prototype['clone'] = ClassHandle_clone;
            ClassHandle.prototype['delete'] = ClassHandle_delete;
            ClassHandle.prototype['isDeleted'] = ClassHandle_isDeleted;
            ClassHandle.prototype['deleteLater'] = ClassHandle_deleteLater;
        }
        function ClassHandle() {}
        var registeredPointers = {};
        function ensureOverloadTable(proto, methodName, humanName) {
            if (undefined === proto[methodName].overloadTable) {
                var prevFunc = proto[methodName];
                proto[methodName] = function () {
                    if (
                        !proto[methodName].overloadTable.hasOwnProperty(
                            arguments.length,
                        )
                    ) {
                        throwBindingError(
                            "Function '" +
                                humanName +
                                "' called with an invalid number of arguments (" +
                                arguments.length +
                                ') - expects one of (' +
                                proto[methodName].overloadTable +
                                ')!',
                        );
                    }
                    return proto[methodName].overloadTable[
                        arguments.length
                    ].apply(this, arguments);
                };
                proto[methodName].overloadTable = [];
                proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
            }
        }
        function exposePublicSymbol(name, value, numArguments) {
            if (Module.hasOwnProperty(name)) {
                if (
                    undefined === numArguments ||
                    (undefined !== Module[name].overloadTable &&
                        undefined !== Module[name].overloadTable[numArguments])
                ) {
                    throwBindingError(
                        "Cannot register public name '" + name + "' twice",
                    );
                }
                ensureOverloadTable(Module, name, name);
                if (Module.hasOwnProperty(numArguments)) {
                    throwBindingError(
                        'Cannot register multiple overloads of a function with the same number of arguments (' +
                            numArguments +
                            ')!',
                    );
                }
                Module[name].overloadTable[numArguments] = value;
            } else {
                Module[name] = value;
                if (undefined !== numArguments) {
                    Module[name].numArguments = numArguments;
                }
            }
        }
        function RegisteredClass(
            name,
            constructor,
            instancePrototype,
            rawDestructor,
            baseClass,
            getActualType,
            upcast,
            downcast,
        ) {
            this.name = name;
            this.constructor = constructor;
            this.instancePrototype = instancePrototype;
            this.rawDestructor = rawDestructor;
            this.baseClass = baseClass;
            this.getActualType = getActualType;
            this.upcast = upcast;
            this.downcast = downcast;
            this.pureVirtualFunctions = [];
        }
        function upcastPointer(ptr, ptrClass, desiredClass) {
            while (ptrClass !== desiredClass) {
                if (!ptrClass.upcast) {
                    throwBindingError(
                        'Expected null or instance of ' +
                            desiredClass.name +
                            ', got an instance of ' +
                            ptrClass.name,
                    );
                }
                ptr = ptrClass.upcast(ptr);
                ptrClass = ptrClass.baseClass;
            }
            return ptr;
        }
        function constNoSmartPtrRawPointerToWireType(destructors, handle) {
            if (handle === null) {
                if (this.isReference) {
                    throwBindingError('null is not a valid ' + this.name);
                }
                return 0;
            }
            if (!handle.$$) {
                throwBindingError(
                    'Cannot pass "' +
                        _embind_repr(handle) +
                        '" as a ' +
                        this.name,
                );
            }
            if (!handle.$$.ptr) {
                throwBindingError(
                    'Cannot pass deleted object as a pointer of type ' +
                        this.name,
                );
            }
            var handleClass = handle.$$.ptrType.registeredClass;
            var ptr = upcastPointer(
                handle.$$.ptr,
                handleClass,
                this.registeredClass,
            );
            return ptr;
        }
        function genericPointerToWireType(destructors, handle) {
            var ptr;
            if (handle === null) {
                if (this.isReference) {
                    throwBindingError('null is not a valid ' + this.name);
                }
                if (this.isSmartPointer) {
                    ptr = this.rawConstructor();
                    if (destructors !== null) {
                        destructors.push(this.rawDestructor, ptr);
                    }
                    return ptr;
                } else {
                    return 0;
                }
            }
            if (!handle.$$) {
                throwBindingError(
                    'Cannot pass "' +
                        _embind_repr(handle) +
                        '" as a ' +
                        this.name,
                );
            }
            if (!handle.$$.ptr) {
                throwBindingError(
                    'Cannot pass deleted object as a pointer of type ' +
                        this.name,
                );
            }
            if (!this.isConst && handle.$$.ptrType.isConst) {
                throwBindingError(
                    'Cannot convert argument of type ' +
                        (handle.$$.smartPtrType
                            ? handle.$$.smartPtrType.name
                            : handle.$$.ptrType.name) +
                        ' to parameter type ' +
                        this.name,
                );
            }
            var handleClass = handle.$$.ptrType.registeredClass;
            ptr = upcastPointer(
                handle.$$.ptr,
                handleClass,
                this.registeredClass,
            );
            if (this.isSmartPointer) {
                if (undefined === handle.$$.smartPtr) {
                    throwBindingError(
                        'Passing raw pointer to smart pointer is illegal',
                    );
                }
                switch (this.sharingPolicy) {
                    case 0:
                        if (handle.$$.smartPtrType === this) {
                            ptr = handle.$$.smartPtr;
                        } else {
                            throwBindingError(
                                'Cannot convert argument of type ' +
                                    (handle.$$.smartPtrType
                                        ? handle.$$.smartPtrType.name
                                        : handle.$$.ptrType.name) +
                                    ' to parameter type ' +
                                    this.name,
                            );
                        }
                        break;
                    case 1:
                        ptr = handle.$$.smartPtr;
                        break;
                    case 2:
                        if (handle.$$.smartPtrType === this) {
                            ptr = handle.$$.smartPtr;
                        } else {
                            var clonedHandle = handle['clone']();
                            ptr = this.rawShare(
                                ptr,
                                __emval_register(function () {
                                    clonedHandle['delete']();
                                }),
                            );
                            if (destructors !== null) {
                                destructors.push(this.rawDestructor, ptr);
                            }
                        }
                        break;
                    default:
                        throwBindingError('Unsupporting sharing policy');
                }
            }
            return ptr;
        }
        function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
            if (handle === null) {
                if (this.isReference) {
                    throwBindingError('null is not a valid ' + this.name);
                }
                return 0;
            }
            if (!handle.$$) {
                throwBindingError(
                    'Cannot pass "' +
                        _embind_repr(handle) +
                        '" as a ' +
                        this.name,
                );
            }
            if (!handle.$$.ptr) {
                throwBindingError(
                    'Cannot pass deleted object as a pointer of type ' +
                        this.name,
                );
            }
            if (handle.$$.ptrType.isConst) {
                throwBindingError(
                    'Cannot convert argument of type ' +
                        handle.$$.ptrType.name +
                        ' to parameter type ' +
                        this.name,
                );
            }
            var handleClass = handle.$$.ptrType.registeredClass;
            var ptr = upcastPointer(
                handle.$$.ptr,
                handleClass,
                this.registeredClass,
            );
            return ptr;
        }
        function simpleReadValueFromPointer(pointer) {
            return this['fromWireType'](HEAPU32[pointer >> 2]);
        }
        function RegisteredPointer_getPointee(ptr) {
            if (this.rawGetPointee) {
                ptr = this.rawGetPointee(ptr);
            }
            return ptr;
        }
        function RegisteredPointer_destructor(ptr) {
            if (this.rawDestructor) {
                this.rawDestructor(ptr);
            }
        }
        function RegisteredPointer_deleteObject(handle) {
            if (handle !== null) {
                handle['delete']();
            }
        }
        function downcastPointer(ptr, ptrClass, desiredClass) {
            if (ptrClass === desiredClass) {
                return ptr;
            }
            if (undefined === desiredClass.baseClass) {
                return null;
            }
            var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
            if (rv === null) {
                return null;
            }
            return desiredClass.downcast(rv);
        }
        function getInheritedInstanceCount() {
            return Object.keys(registeredInstances).length;
        }
        function getLiveInheritedInstances() {
            var rv = [];
            for (var k in registeredInstances) {
                if (registeredInstances.hasOwnProperty(k)) {
                    rv.push(registeredInstances[k]);
                }
            }
            return rv;
        }
        function setDelayFunction(fn) {
            delayFunction = fn;
            if (deletionQueue.length && delayFunction) {
                delayFunction(flushPendingDeletes);
            }
        }
        function init_embind() {
            Module['getInheritedInstanceCount'] = getInheritedInstanceCount;
            Module['getLiveInheritedInstances'] = getLiveInheritedInstances;
            Module['flushPendingDeletes'] = flushPendingDeletes;
            Module['setDelayFunction'] = setDelayFunction;
        }
        var registeredInstances = {};
        function getBasestPointer(class_, ptr) {
            if (ptr === undefined) {
                throwBindingError('ptr should not be undefined');
            }
            while (class_.baseClass) {
                ptr = class_.upcast(ptr);
                class_ = class_.baseClass;
            }
            return ptr;
        }
        function getInheritedInstance(class_, ptr) {
            ptr = getBasestPointer(class_, ptr);
            return registeredInstances[ptr];
        }
        function makeClassHandle(prototype, record) {
            if (!record.ptrType || !record.ptr) {
                throwInternalError('makeClassHandle requires ptr and ptrType');
            }
            var hasSmartPtrType = !!record.smartPtrType;
            var hasSmartPtr = !!record.smartPtr;
            if (hasSmartPtrType !== hasSmartPtr) {
                throwInternalError(
                    'Both smartPtrType and smartPtr must be specified',
                );
            }
            record.count = { value: 1 };
            return attachFinalizer(
                Object.create(prototype, { $$: { value: record } }),
            );
        }
        function RegisteredPointer_fromWireType(ptr) {
            var rawPointer = this.getPointee(ptr);
            if (!rawPointer) {
                this.destructor(ptr);
                return null;
            }
            var registeredInstance = getInheritedInstance(
                this.registeredClass,
                rawPointer,
            );
            if (undefined !== registeredInstance) {
                if (0 === registeredInstance.$$.count.value) {
                    registeredInstance.$$.ptr = rawPointer;
                    registeredInstance.$$.smartPtr = ptr;
                    return registeredInstance['clone']();
                } else {
                    var rv = registeredInstance['clone']();
                    this.destructor(ptr);
                    return rv;
                }
            }
            function makeDefaultHandle() {
                if (this.isSmartPointer) {
                    return makeClassHandle(
                        this.registeredClass.instancePrototype,
                        {
                            ptrType: this.pointeeType,
                            ptr: rawPointer,
                            smartPtrType: this,
                            smartPtr: ptr,
                        },
                    );
                } else {
                    return makeClassHandle(
                        this.registeredClass.instancePrototype,
                        { ptrType: this, ptr: ptr },
                    );
                }
            }
            var actualType = this.registeredClass.getActualType(rawPointer);
            var registeredPointerRecord = registeredPointers[actualType];
            if (!registeredPointerRecord) {
                return makeDefaultHandle.call(this);
            }
            var toType;
            if (this.isConst) {
                toType = registeredPointerRecord.constPointerType;
            } else {
                toType = registeredPointerRecord.pointerType;
            }
            var dp = downcastPointer(
                rawPointer,
                this.registeredClass,
                toType.registeredClass,
            );
            if (dp === null) {
                return makeDefaultHandle.call(this);
            }
            if (this.isSmartPointer) {
                return makeClassHandle(
                    toType.registeredClass.instancePrototype,
                    {
                        ptrType: toType,
                        ptr: dp,
                        smartPtrType: this,
                        smartPtr: ptr,
                    },
                );
            } else {
                return makeClassHandle(
                    toType.registeredClass.instancePrototype,
                    { ptrType: toType, ptr: dp },
                );
            }
        }
        function init_RegisteredPointer() {
            RegisteredPointer.prototype.getPointee =
                RegisteredPointer_getPointee;
            RegisteredPointer.prototype.destructor =
                RegisteredPointer_destructor;
            RegisteredPointer.prototype['argPackAdvance'] = 8;
            RegisteredPointer.prototype['readValueFromPointer'] =
                simpleReadValueFromPointer;
            RegisteredPointer.prototype['deleteObject'] =
                RegisteredPointer_deleteObject;
            RegisteredPointer.prototype['fromWireType'] =
                RegisteredPointer_fromWireType;
        }
        function RegisteredPointer(
            name,
            registeredClass,
            isReference,
            isConst,
            isSmartPointer,
            pointeeType,
            sharingPolicy,
            rawGetPointee,
            rawConstructor,
            rawShare,
            rawDestructor,
        ) {
            this.name = name;
            this.registeredClass = registeredClass;
            this.isReference = isReference;
            this.isConst = isConst;
            this.isSmartPointer = isSmartPointer;
            this.pointeeType = pointeeType;
            this.sharingPolicy = sharingPolicy;
            this.rawGetPointee = rawGetPointee;
            this.rawConstructor = rawConstructor;
            this.rawShare = rawShare;
            this.rawDestructor = rawDestructor;
            if (!isSmartPointer && registeredClass.baseClass === undefined) {
                if (isConst) {
                    this['toWireType'] = constNoSmartPtrRawPointerToWireType;
                    this.destructorFunction = null;
                } else {
                    this['toWireType'] = nonConstNoSmartPtrRawPointerToWireType;
                    this.destructorFunction = null;
                }
            } else {
                this['toWireType'] = genericPointerToWireType;
            }
        }
        function replacePublicSymbol(name, value, numArguments) {
            if (!Module.hasOwnProperty(name)) {
                throwInternalError('Replacing nonexistant public symbol');
            }
            if (
                undefined !== Module[name].overloadTable &&
                undefined !== numArguments
            ) {
                Module[name].overloadTable[numArguments] = value;
            } else {
                Module[name] = value;
                Module[name].argCount = numArguments;
            }
        }
        function dynCallLegacy(sig, ptr, args) {
            var f = Module['dynCall_' + sig];
            return args && args.length
                ? f.apply(null, [ptr].concat(args))
                : f.call(null, ptr);
        }
        function dynCall(sig, ptr, args) {
            return dynCallLegacy(sig, ptr, args);
        }
        function getDynCaller(sig, ptr) {
            var argCache = [];
            return function () {
                argCache.length = arguments.length;
                for (var i = 0; i < arguments.length; i++) {
                    argCache[i] = arguments[i];
                }
                return dynCall(sig, ptr, argCache);
            };
        }
        function embind__requireFunction(signature, rawFunction) {
            signature = readLatin1String(signature);
            function makeDynCaller() {
                return getDynCaller(signature, rawFunction);
            }
            var fp = makeDynCaller();
            if (typeof fp !== 'function') {
                throwBindingError(
                    'unknown function pointer with signature ' +
                        signature +
                        ': ' +
                        rawFunction,
                );
            }
            return fp;
        }
        var UnboundTypeError = undefined;
        function getTypeName(type) {
            var ptr = ___getTypeName(type);
            var rv = readLatin1String(ptr);
            _free(ptr);
            return rv;
        }
        function throwUnboundTypeError(message, types) {
            var unboundTypes = [];
            var seen = {};
            function visit(type) {
                if (seen[type]) {
                    return;
                }
                if (registeredTypes[type]) {
                    return;
                }
                if (typeDependencies[type]) {
                    typeDependencies[type].forEach(visit);
                    return;
                }
                unboundTypes.push(type);
                seen[type] = true;
            }
            types.forEach(visit);
            throw new UnboundTypeError(
                message + ': ' + unboundTypes.map(getTypeName).join([', ']),
            );
        }
        function __embind_register_class(
            rawType,
            rawPointerType,
            rawConstPointerType,
            baseClassRawType,
            getActualTypeSignature,
            getActualType,
            upcastSignature,
            upcast,
            downcastSignature,
            downcast,
            name,
            destructorSignature,
            rawDestructor,
        ) {
            name = readLatin1String(name);
            getActualType = embind__requireFunction(
                getActualTypeSignature,
                getActualType,
            );
            if (upcast) {
                upcast = embind__requireFunction(upcastSignature, upcast);
            }
            if (downcast) {
                downcast = embind__requireFunction(downcastSignature, downcast);
            }
            rawDestructor = embind__requireFunction(
                destructorSignature,
                rawDestructor,
            );
            var legalFunctionName = makeLegalFunctionName(name);
            exposePublicSymbol(legalFunctionName, function () {
                throwUnboundTypeError(
                    'Cannot construct ' + name + ' due to unbound types',
                    [baseClassRawType],
                );
            });
            whenDependentTypesAreResolved(
                [rawType, rawPointerType, rawConstPointerType],
                baseClassRawType ? [baseClassRawType] : [],
                function (base) {
                    base = base[0];
                    var baseClass;
                    var basePrototype;
                    if (baseClassRawType) {
                        baseClass = base.registeredClass;
                        basePrototype = baseClass.instancePrototype;
                    } else {
                        basePrototype = ClassHandle.prototype;
                    }
                    var constructor = createNamedFunction(
                        legalFunctionName,
                        function () {
                            if (
                                Object.getPrototypeOf(this) !==
                                instancePrototype
                            ) {
                                throw new BindingError(
                                    "Use 'new' to construct " + name,
                                );
                            }
                            if (
                                undefined === registeredClass.constructor_body
                            ) {
                                throw new BindingError(
                                    name + ' has no accessible constructor',
                                );
                            }
                            var body =
                                registeredClass.constructor_body[
                                    arguments.length
                                ];
                            if (undefined === body) {
                                throw new BindingError(
                                    'Tried to invoke ctor of ' +
                                        name +
                                        ' with invalid number of parameters (' +
                                        arguments.length +
                                        ') - expected (' +
                                        Object.keys(
                                            registeredClass.constructor_body,
                                        ).toString() +
                                        ') parameters instead!',
                                );
                            }
                            return body.apply(this, arguments);
                        },
                    );
                    var instancePrototype = Object.create(basePrototype, {
                        constructor: { value: constructor },
                    });
                    constructor.prototype = instancePrototype;
                    var registeredClass = new RegisteredClass(
                        name,
                        constructor,
                        instancePrototype,
                        rawDestructor,
                        baseClass,
                        getActualType,
                        upcast,
                        downcast,
                    );
                    var referenceConverter = new RegisteredPointer(
                        name,
                        registeredClass,
                        true,
                        false,
                        false,
                    );
                    var pointerConverter = new RegisteredPointer(
                        name + '*',
                        registeredClass,
                        false,
                        false,
                        false,
                    );
                    var constPointerConverter = new RegisteredPointer(
                        name + ' const*',
                        registeredClass,
                        false,
                        true,
                        false,
                    );
                    registeredPointers[rawType] = {
                        pointerType: pointerConverter,
                        constPointerType: constPointerConverter,
                    };
                    replacePublicSymbol(legalFunctionName, constructor);
                    return [
                        referenceConverter,
                        pointerConverter,
                        constPointerConverter,
                    ];
                },
            );
        }
        function new_(constructor, argumentList) {
            if (!(constructor instanceof Function)) {
                throw new TypeError(
                    'new_ called with constructor type ' +
                        typeof constructor +
                        ' which is not a function',
                );
            }
            var dummy = createNamedFunction(
                constructor.name || 'unknownFunctionName',
                function () {},
            );
            dummy.prototype = constructor.prototype;
            var obj = new dummy();
            var r = constructor.apply(obj, argumentList);
            return r instanceof Object ? r : obj;
        }
        function runDestructors(destructors) {
            while (destructors.length) {
                var ptr = destructors.pop();
                var del = destructors.pop();
                del(ptr);
            }
        }
        function craftInvokerFunction(
            humanName,
            argTypes,
            classType,
            cppInvokerFunc,
            cppTargetFunc,
        ) {
            var argCount = argTypes.length;
            if (argCount < 2) {
                throwBindingError(
                    "argTypes array size mismatch! Must at least get return value and 'this' types!",
                );
            }
            var isClassMethodFunc = argTypes[1] !== null && classType !== null;
            var needsDestructorStack = false;
            for (var i = 1; i < argTypes.length; ++i) {
                if (
                    argTypes[i] !== null &&
                    argTypes[i].destructorFunction === undefined
                ) {
                    needsDestructorStack = true;
                    break;
                }
            }
            var returns = argTypes[0].name !== 'void';
            var argsList = '';
            var argsListWired = '';
            for (var i = 0; i < argCount - 2; ++i) {
                argsList += (i !== 0 ? ', ' : '') + 'arg' + i;
                argsListWired += (i !== 0 ? ', ' : '') + 'arg' + i + 'Wired';
            }
            var invokerFnBody =
                'return function ' +
                makeLegalFunctionName(humanName) +
                '(' +
                argsList +
                ') {\n' +
                'if (arguments.length !== ' +
                (argCount - 2) +
                ') {\n' +
                "throwBindingError('function " +
                humanName +
                " called with ' + arguments.length + ' arguments, expected " +
                (argCount - 2) +
                " args!');\n" +
                '}\n';
            if (needsDestructorStack) {
                invokerFnBody += 'var destructors = [];\n';
            }
            var dtorStack = needsDestructorStack ? 'destructors' : 'null';
            var args1 = [
                'throwBindingError',
                'invoker',
                'fn',
                'runDestructors',
                'retType',
                'classParam',
            ];
            var args2 = [
                throwBindingError,
                cppInvokerFunc,
                cppTargetFunc,
                runDestructors,
                argTypes[0],
                argTypes[1],
            ];
            if (isClassMethodFunc) {
                invokerFnBody +=
                    'var thisWired = classParam.toWireType(' +
                    dtorStack +
                    ', this);\n';
            }
            for (var i = 0; i < argCount - 2; ++i) {
                invokerFnBody +=
                    'var arg' +
                    i +
                    'Wired = argType' +
                    i +
                    '.toWireType(' +
                    dtorStack +
                    ', arg' +
                    i +
                    '); // ' +
                    argTypes[i + 2].name +
                    '\n';
                args1.push('argType' + i);
                args2.push(argTypes[i + 2]);
            }
            if (isClassMethodFunc) {
                argsListWired =
                    'thisWired' +
                    (argsListWired.length > 0 ? ', ' : '') +
                    argsListWired;
            }
            invokerFnBody +=
                (returns ? 'var rv = ' : '') +
                'invoker(fn' +
                (argsListWired.length > 0 ? ', ' : '') +
                argsListWired +
                ');\n';
            if (needsDestructorStack) {
                invokerFnBody += 'runDestructors(destructors);\n';
            } else {
                for (
                    var i = isClassMethodFunc ? 1 : 2;
                    i < argTypes.length;
                    ++i
                ) {
                    var paramName =
                        i === 1 ? 'thisWired' : 'arg' + (i - 2) + 'Wired';
                    if (argTypes[i].destructorFunction !== null) {
                        invokerFnBody +=
                            paramName +
                            '_dtor(' +
                            paramName +
                            '); // ' +
                            argTypes[i].name +
                            '\n';
                        args1.push(paramName + '_dtor');
                        args2.push(argTypes[i].destructorFunction);
                    }
                }
            }
            if (returns) {
                invokerFnBody +=
                    'var ret = retType.fromWireType(rv);\n' + 'return ret;\n';
            } else {
            }
            invokerFnBody += '}\n';
            args1.push(invokerFnBody);
            var invokerFunction = new_(Function, args1).apply(null, args2);
            return invokerFunction;
        }
        function heap32VectorToArray(count, firstElement) {
            var array = [];
            for (var i = 0; i < count; i++) {
                array.push(HEAP32[(firstElement >> 2) + i]);
            }
            return array;
        }
        function __embind_register_class_function(
            rawClassType,
            methodName,
            argCount,
            rawArgTypesAddr,
            invokerSignature,
            rawInvoker,
            context,
            isPureVirtual,
        ) {
            var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
            methodName = readLatin1String(methodName);
            rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
            whenDependentTypesAreResolved(
                [],
                [rawClassType],
                function (classType) {
                    classType = classType[0];
                    var humanName = classType.name + '.' + methodName;
                    if (isPureVirtual) {
                        classType.registeredClass.pureVirtualFunctions.push(
                            methodName,
                        );
                    }
                    function unboundTypesHandler() {
                        throwUnboundTypeError(
                            'Cannot call ' +
                                humanName +
                                ' due to unbound types',
                            rawArgTypes,
                        );
                    }
                    var proto = classType.registeredClass.instancePrototype;
                    var method = proto[methodName];
                    if (
                        undefined === method ||
                        (undefined === method.overloadTable &&
                            method.className !== classType.name &&
                            method.argCount === argCount - 2)
                    ) {
                        unboundTypesHandler.argCount = argCount - 2;
                        unboundTypesHandler.className = classType.name;
                        proto[methodName] = unboundTypesHandler;
                    } else {
                        ensureOverloadTable(proto, methodName, humanName);
                        proto[methodName].overloadTable[argCount - 2] =
                            unboundTypesHandler;
                    }
                    whenDependentTypesAreResolved(
                        [],
                        rawArgTypes,
                        function (argTypes) {
                            var memberFunction = craftInvokerFunction(
                                humanName,
                                argTypes,
                                classType,
                                rawInvoker,
                                context,
                            );
                            if (undefined === proto[methodName].overloadTable) {
                                memberFunction.argCount = argCount - 2;
                                proto[methodName] = memberFunction;
                            } else {
                                proto[methodName].overloadTable[argCount - 2] =
                                    memberFunction;
                            }
                            return [];
                        },
                    );
                    return [];
                },
            );
        }
        function __embind_register_constant(name, type, value) {
            name = readLatin1String(name);
            whenDependentTypesAreResolved([], [type], function (type) {
                type = type[0];
                Module[name] = type['fromWireType'](value);
                return [];
            });
        }
        var emval_free_list = [];
        var emval_handle_array = [
            {},
            { value: undefined },
            { value: null },
            { value: true },
            { value: false },
        ];
        function __emval_decref(handle) {
            if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
                emval_handle_array[handle] = undefined;
                emval_free_list.push(handle);
            }
        }
        function count_emval_handles() {
            var count = 0;
            for (var i = 5; i < emval_handle_array.length; ++i) {
                if (emval_handle_array[i] !== undefined) {
                    ++count;
                }
            }
            return count;
        }
        function get_first_emval() {
            for (var i = 5; i < emval_handle_array.length; ++i) {
                if (emval_handle_array[i] !== undefined) {
                    return emval_handle_array[i];
                }
            }
            return null;
        }
        function init_emval() {
            Module['count_emval_handles'] = count_emval_handles;
            Module['get_first_emval'] = get_first_emval;
        }
        function __emval_register(value) {
            switch (value) {
                case undefined: {
                    return 1;
                }
                case null: {
                    return 2;
                }
                case true: {
                    return 3;
                }
                case false: {
                    return 4;
                }
                default: {
                    var handle = emval_free_list.length
                        ? emval_free_list.pop()
                        : emval_handle_array.length;
                    emval_handle_array[handle] = { refcount: 1, value: value };
                    return handle;
                }
            }
        }
        function __embind_register_emval(rawType, name) {
            name = readLatin1String(name);
            registerType(rawType, {
                name: name,
                fromWireType: function (handle) {
                    var rv = emval_handle_array[handle].value;
                    __emval_decref(handle);
                    return rv;
                },
                toWireType: function (destructors, value) {
                    return __emval_register(value);
                },
                argPackAdvance: 8,
                readValueFromPointer: simpleReadValueFromPointer,
                destructorFunction: null,
            });
        }
        function _embind_repr(v) {
            if (v === null) {
                return 'null';
            }
            var t = typeof v;
            if (t === 'object' || t === 'array' || t === 'function') {
                return v.toString();
            } else {
                return '' + v;
            }
        }
        function floatReadValueFromPointer(name, shift) {
            switch (shift) {
                case 2:
                    return function (pointer) {
                        return this['fromWireType'](HEAPF32[pointer >> 2]);
                    };
                case 3:
                    return function (pointer) {
                        return this['fromWireType'](HEAPF64[pointer >> 3]);
                    };
                default:
                    throw new TypeError('Unknown float type: ' + name);
            }
        }
        function __embind_register_float(rawType, name, size) {
            var shift = getShiftFromSize(size);
            name = readLatin1String(name);
            registerType(rawType, {
                name: name,
                fromWireType: function (value) {
                    return value;
                },
                toWireType: function (destructors, value) {
                    if (
                        typeof value !== 'number' &&
                        typeof value !== 'boolean'
                    ) {
                        throw new TypeError(
                            'Cannot convert "' +
                                _embind_repr(value) +
                                '" to ' +
                                this.name,
                        );
                    }
                    return value;
                },
                argPackAdvance: 8,
                readValueFromPointer: floatReadValueFromPointer(name, shift),
                destructorFunction: null,
            });
        }
        function __embind_register_function(
            name,
            argCount,
            rawArgTypesAddr,
            signature,
            rawInvoker,
            fn,
        ) {
            var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
            name = readLatin1String(name);
            rawInvoker = embind__requireFunction(signature, rawInvoker);
            exposePublicSymbol(
                name,
                function () {
                    throwUnboundTypeError(
                        'Cannot call ' + name + ' due to unbound types',
                        argTypes,
                    );
                },
                argCount - 1,
            );
            whenDependentTypesAreResolved([], argTypes, function (argTypes) {
                var invokerArgsArray = [argTypes[0], null].concat(
                    argTypes.slice(1),
                );
                replacePublicSymbol(
                    name,
                    craftInvokerFunction(
                        name,
                        invokerArgsArray,
                        null,
                        rawInvoker,
                        fn,
                    ),
                    argCount - 1,
                );
                return [];
            });
        }
        function integerReadValueFromPointer(name, shift, signed) {
            switch (shift) {
                case 0:
                    return signed
                        ? function readS8FromPointer(pointer) {
                              return HEAP8[pointer];
                          }
                        : function readU8FromPointer(pointer) {
                              return HEAPU8[pointer];
                          };
                case 1:
                    return signed
                        ? function readS16FromPointer(pointer) {
                              return HEAP16[pointer >> 1];
                          }
                        : function readU16FromPointer(pointer) {
                              return HEAPU16[pointer >> 1];
                          };
                case 2:
                    return signed
                        ? function readS32FromPointer(pointer) {
                              return HEAP32[pointer >> 2];
                          }
                        : function readU32FromPointer(pointer) {
                              return HEAPU32[pointer >> 2];
                          };
                default:
                    throw new TypeError('Unknown integer type: ' + name);
            }
        }
        function __embind_register_integer(
            primitiveType,
            name,
            size,
            minRange,
            maxRange,
        ) {
            name = readLatin1String(name);
            if (maxRange === -1) {
                maxRange = 4294967295;
            }
            var shift = getShiftFromSize(size);
            var fromWireType = function (value) {
                return value;
            };
            if (minRange === 0) {
                var bitshift = 32 - 8 * size;
                fromWireType = function (value) {
                    return (value << bitshift) >>> bitshift;
                };
            }
            var isUnsignedType = name.includes('unsigned');
            registerType(primitiveType, {
                name: name,
                fromWireType: fromWireType,
                toWireType: function (destructors, value) {
                    if (
                        typeof value !== 'number' &&
                        typeof value !== 'boolean'
                    ) {
                        throw new TypeError(
                            'Cannot convert "' +
                                _embind_repr(value) +
                                '" to ' +
                                this.name,
                        );
                    }
                    if (value < minRange || value > maxRange) {
                        throw new TypeError(
                            'Passing a number "' +
                                _embind_repr(value) +
                                '" from JS side to C/C++ side to an argument of type "' +
                                name +
                                '", which is outside the valid range [' +
                                minRange +
                                ', ' +
                                maxRange +
                                ']!',
                        );
                    }
                    return isUnsignedType ? value >>> 0 : value | 0;
                },
                argPackAdvance: 8,
                readValueFromPointer: integerReadValueFromPointer(
                    name,
                    shift,
                    minRange !== 0,
                ),
                destructorFunction: null,
            });
        }
        function __embind_register_memory_view(rawType, dataTypeIndex, name) {
            var typeMapping = [
                Int8Array,
                Uint8Array,
                Int16Array,
                Uint16Array,
                Int32Array,
                Uint32Array,
                Float32Array,
                Float64Array,
            ];
            var TA = typeMapping[dataTypeIndex];
            function decodeMemoryView(handle) {
                handle = handle >> 2;
                var heap = HEAPU32;
                var size = heap[handle];
                var data = heap[handle + 1];
                return new TA(buffer, data, size);
            }
            name = readLatin1String(name);
            registerType(
                rawType,
                {
                    name: name,
                    fromWireType: decodeMemoryView,
                    argPackAdvance: 8,
                    readValueFromPointer: decodeMemoryView,
                },
                { ignoreDuplicateRegistrations: true },
            );
        }
        function __embind_register_std_string(rawType, name) {
            name = readLatin1String(name);
            var stdStringIsUTF8 = name === 'std::string';
            registerType(rawType, {
                name: name,
                fromWireType: function (value) {
                    var length = HEAPU32[value >> 2];
                    var str;
                    if (stdStringIsUTF8) {
                        var decodeStartPtr = value + 4;
                        for (var i = 0; i <= length; ++i) {
                            var currentBytePtr = value + 4 + i;
                            if (i == length || HEAPU8[currentBytePtr] == 0) {
                                var maxRead = currentBytePtr - decodeStartPtr;
                                var stringSegment = UTF8ToString(
                                    decodeStartPtr,
                                    maxRead,
                                );
                                if (str === undefined) {
                                    str = stringSegment;
                                } else {
                                    str += String.fromCharCode(0);
                                    str += stringSegment;
                                }
                                decodeStartPtr = currentBytePtr + 1;
                            }
                        }
                    } else {
                        var a = new Array(length);
                        for (var i = 0; i < length; ++i) {
                            a[i] = String.fromCharCode(HEAPU8[value + 4 + i]);
                        }
                        str = a.join('');
                    }
                    _free(value);
                    return str;
                },
                toWireType: function (destructors, value) {
                    if (value instanceof ArrayBuffer) {
                        value = new Uint8Array(value);
                    }
                    var getLength;
                    var valueIsOfTypeString = typeof value === 'string';
                    if (
                        !(
                            valueIsOfTypeString ||
                            value instanceof Uint8Array ||
                            value instanceof Uint8ClampedArray ||
                            value instanceof Int8Array
                        )
                    ) {
                        throwBindingError(
                            'Cannot pass non-string to std::string',
                        );
                    }
                    if (stdStringIsUTF8 && valueIsOfTypeString) {
                        getLength = function () {
                            return lengthBytesUTF8(value);
                        };
                    } else {
                        getLength = function () {
                            return value.length;
                        };
                    }
                    var length = getLength();
                    var ptr = _malloc(4 + length + 1);
                    HEAPU32[ptr >> 2] = length;
                    if (stdStringIsUTF8 && valueIsOfTypeString) {
                        stringToUTF8(value, ptr + 4, length + 1);
                    } else {
                        if (valueIsOfTypeString) {
                            for (var i = 0; i < length; ++i) {
                                var charCode = value.charCodeAt(i);
                                if (charCode > 255) {
                                    _free(ptr);
                                    throwBindingError(
                                        'String has UTF-16 code units that do not fit in 8 bits',
                                    );
                                }
                                HEAPU8[ptr + 4 + i] = charCode;
                            }
                        } else {
                            for (var i = 0; i < length; ++i) {
                                HEAPU8[ptr + 4 + i] = value[i];
                            }
                        }
                    }
                    if (destructors !== null) {
                        destructors.push(_free, ptr);
                    }
                    return ptr;
                },
                argPackAdvance: 8,
                readValueFromPointer: simpleReadValueFromPointer,
                destructorFunction: function (ptr) {
                    _free(ptr);
                },
            });
        }
        function __embind_register_std_wstring(rawType, charSize, name) {
            name = readLatin1String(name);
            var decodeString, encodeString, getHeap, lengthBytesUTF, shift;
            if (charSize === 2) {
                decodeString = UTF16ToString;
                encodeString = stringToUTF16;
                lengthBytesUTF = lengthBytesUTF16;
                getHeap = function () {
                    return HEAPU16;
                };
                shift = 1;
            } else if (charSize === 4) {
                decodeString = UTF32ToString;
                encodeString = stringToUTF32;
                lengthBytesUTF = lengthBytesUTF32;
                getHeap = function () {
                    return HEAPU32;
                };
                shift = 2;
            }
            registerType(rawType, {
                name: name,
                fromWireType: function (value) {
                    var length = HEAPU32[value >> 2];
                    var HEAP = getHeap();
                    var str;
                    var decodeStartPtr = value + 4;
                    for (var i = 0; i <= length; ++i) {
                        var currentBytePtr = value + 4 + i * charSize;
                        if (i == length || HEAP[currentBytePtr >> shift] == 0) {
                            var maxReadBytes = currentBytePtr - decodeStartPtr;
                            var stringSegment = decodeString(
                                decodeStartPtr,
                                maxReadBytes,
                            );
                            if (str === undefined) {
                                str = stringSegment;
                            } else {
                                str += String.fromCharCode(0);
                                str += stringSegment;
                            }
                            decodeStartPtr = currentBytePtr + charSize;
                        }
                    }
                    _free(value);
                    return str;
                },
                toWireType: function (destructors, value) {
                    if (!(typeof value === 'string')) {
                        throwBindingError(
                            'Cannot pass non-string to C++ string type ' + name,
                        );
                    }
                    var length = lengthBytesUTF(value);
                    var ptr = _malloc(4 + length + charSize);
                    HEAPU32[ptr >> 2] = length >> shift;
                    encodeString(value, ptr + 4, length + charSize);
                    if (destructors !== null) {
                        destructors.push(_free, ptr);
                    }
                    return ptr;
                },
                argPackAdvance: 8,
                readValueFromPointer: simpleReadValueFromPointer,
                destructorFunction: function (ptr) {
                    _free(ptr);
                },
            });
        }
        function __embind_register_void(rawType, name) {
            name = readLatin1String(name);
            registerType(rawType, {
                isVoid: true,
                name: name,
                argPackAdvance: 0,
                fromWireType: function () {
                    return undefined;
                },
                toWireType: function (destructors, o) {
                    return undefined;
                },
            });
        }
        function requireHandle(handle) {
            if (!handle) {
                throwBindingError('Cannot use deleted val. handle = ' + handle);
            }
            return emval_handle_array[handle].value;
        }
        function requireRegisteredType(rawType, humanName) {
            var impl = registeredTypes[rawType];
            if (undefined === impl) {
                throwBindingError(
                    humanName + ' has unknown type ' + getTypeName(rawType),
                );
            }
            return impl;
        }
        function __emval_as(handle, returnType, destructorsRef) {
            handle = requireHandle(handle);
            returnType = requireRegisteredType(returnType, 'emval::as');
            var destructors = [];
            var rd = __emval_register(destructors);
            HEAP32[destructorsRef >> 2] = rd;
            return returnType['toWireType'](destructors, handle);
        }
        function __emval_lookupTypes(argCount, argTypes) {
            var a = new Array(argCount);
            for (var i = 0; i < argCount; ++i) {
                a[i] = requireRegisteredType(
                    HEAP32[(argTypes >> 2) + i],
                    'parameter ' + i,
                );
            }
            return a;
        }
        function __emval_call(handle, argCount, argTypes, argv) {
            handle = requireHandle(handle);
            var types = __emval_lookupTypes(argCount, argTypes);
            var args = new Array(argCount);
            for (var i = 0; i < argCount; ++i) {
                var type = types[i];
                args[i] = type['readValueFromPointer'](argv);
                argv += type['argPackAdvance'];
            }
            var rv = handle.apply(undefined, args);
            return __emval_register(rv);
        }
        var emval_symbols = {};
        function getStringOrSymbol(address) {
            var symbol = emval_symbols[address];
            if (symbol === undefined) {
                return readLatin1String(address);
            } else {
                return symbol;
            }
        }
        function __emval_get_module_property(name) {
            name = getStringOrSymbol(name);
            return __emval_register(Module[name]);
        }
        function __emval_get_property(handle, key) {
            handle = requireHandle(handle);
            key = requireHandle(key);
            return __emval_register(handle[key]);
        }
        function __emval_incref(handle) {
            if (handle > 4) {
                emval_handle_array[handle].refcount += 1;
            }
        }
        function __emval_new_array() {
            return __emval_register([]);
        }
        function __emval_new_cstring(v) {
            return __emval_register(getStringOrSymbol(v));
        }
        function __emval_new_object() {
            return __emval_register({});
        }
        function __emval_run_destructors(handle) {
            var destructors = emval_handle_array[handle].value;
            runDestructors(destructors);
            __emval_decref(handle);
        }
        function __emval_set_property(handle, key, value) {
            handle = requireHandle(handle);
            key = requireHandle(key);
            value = requireHandle(value);
            handle[key] = value;
        }
        function __emval_take_value(type, argv) {
            type = requireRegisteredType(type, '_emval_take_value');
            var v = type['readValueFromPointer'](argv);
            return __emval_register(v);
        }
        function __emval_typeof(handle) {
            handle = requireHandle(handle);
            return __emval_register(typeof handle);
        }
        function _abort() {
            abort();
        }
        var readAsmConstArgsArray = [];
        function readAsmConstArgs(sigPtr, buf) {
            readAsmConstArgsArray.length = 0;
            var ch;
            buf >>= 2;
            while ((ch = HEAPU8[sigPtr++])) {
                var double = ch < 105;
                if (double && buf & 1) buf++;
                readAsmConstArgsArray.push(
                    double ? HEAPF64[buf++ >> 1] : HEAP32[buf],
                );
                ++buf;
            }
            return readAsmConstArgsArray;
        }
        function _emscripten_asm_const_int(code, sigPtr, argbuf) {
            var args = readAsmConstArgs(sigPtr, argbuf);
            return ASM_CONSTS[code].apply(null, args);
        }
        function _emscripten_set_main_loop_timing(mode, value) {
            Browser.mainLoop.timingMode = mode;
            Browser.mainLoop.timingValue = value;
            if (!Browser.mainLoop.func) {
                return 1;
            }
            if (!Browser.mainLoop.running) {
                Browser.mainLoop.running = true;
            }
            if (mode == 0) {
                Browser.mainLoop.scheduler =
                    function Browser_mainLoop_scheduler_setTimeout() {
                        var timeUntilNextTick =
                            Math.max(
                                0,
                                Browser.mainLoop.tickStartTime +
                                    value -
                                    _emscripten_get_now(),
                            ) | 0;
                        setTimeout(Browser.mainLoop.runner, timeUntilNextTick);
                    };
                Browser.mainLoop.method = 'timeout';
            } else if (mode == 1) {
                Browser.mainLoop.scheduler =
                    function Browser_mainLoop_scheduler_rAF() {
                        Browser.requestAnimationFrame(Browser.mainLoop.runner);
                    };
                Browser.mainLoop.method = 'rAF';
            } else if (mode == 2) {
                if (typeof setImmediate === 'undefined') {
                    var setImmediates = [];
                    var emscriptenMainLoopMessageId = 'setimmediate';
                    var Browser_setImmediate_messageHandler = function (event) {
                        if (
                            event.data === emscriptenMainLoopMessageId ||
                            event.data.target === emscriptenMainLoopMessageId
                        ) {
                            event.stopPropagation();
                            setImmediates.shift()();
                        }
                    };
                    addEventListener(
                        'message',
                        Browser_setImmediate_messageHandler,
                        true,
                    );
                    setImmediate = function Browser_emulated_setImmediate(
                        func,
                    ) {
                        setImmediates.push(func);
                        if (ENVIRONMENT_IS_WORKER) {
                            if (Module['setImmediates'] === undefined)
                                Module['setImmediates'] = [];
                            Module['setImmediates'].push(func);
                            postMessage({
                                target: emscriptenMainLoopMessageId,
                            });
                        } else postMessage(emscriptenMainLoopMessageId, '*');
                    };
                }
                Browser.mainLoop.scheduler =
                    function Browser_mainLoop_scheduler_setImmediate() {
                        setImmediate(Browser.mainLoop.runner);
                    };
                Browser.mainLoop.method = 'immediate';
            }
            return 0;
        }
        var _emscripten_get_now;
        if (ENVIRONMENT_IS_NODE) {
            _emscripten_get_now = function () {
                var t = process['hrtime']();
                return t[0] * 1e3 + t[1] / 1e6;
            };
        } else if (typeof dateNow !== 'undefined') {
            _emscripten_get_now = dateNow;
        } else
            _emscripten_get_now = function () {
                return performance.now();
            };
        function _exit(status) {
            exit(status);
        }
        function maybeExit() {
            if (!keepRuntimeAlive()) {
                try {
                    _exit(EXITSTATUS);
                } catch (e) {
                    if (e instanceof ExitStatus) {
                        return;
                    }
                    throw e;
                }
            }
        }
        function setMainLoop(
            browserIterationFunc,
            fps,
            simulateInfiniteLoop,
            arg,
            noSetTiming,
        ) {
            assert(
                !Browser.mainLoop.func,
                'emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.',
            );
            Browser.mainLoop.func = browserIterationFunc;
            Browser.mainLoop.arg = arg;
            var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
            function checkIsRunning() {
                if (
                    thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop
                ) {
                    maybeExit();
                    return false;
                }
                return true;
            }
            Browser.mainLoop.running = false;
            Browser.mainLoop.runner = function Browser_mainLoop_runner() {
                if (ABORT) return;
                if (Browser.mainLoop.queue.length > 0) {
                    var start = Date.now();
                    var blocker = Browser.mainLoop.queue.shift();
                    blocker.func(blocker.arg);
                    if (Browser.mainLoop.remainingBlockers) {
                        var remaining = Browser.mainLoop.remainingBlockers;
                        var next =
                            remaining % 1 == 0
                                ? remaining - 1
                                : Math.floor(remaining);
                        if (blocker.counted) {
                            Browser.mainLoop.remainingBlockers = next;
                        } else {
                            next = next + 0.5;
                            Browser.mainLoop.remainingBlockers =
                                (8 * remaining + next) / 9;
                        }
                    }
                    console.log(
                        'main loop blocker "' +
                            blocker.name +
                            '" took ' +
                            (Date.now() - start) +
                            ' ms',
                    );
                    Browser.mainLoop.updateStatus();
                    if (!checkIsRunning()) return;
                    setTimeout(Browser.mainLoop.runner, 0);
                    return;
                }
                if (!checkIsRunning()) return;
                Browser.mainLoop.currentFrameNumber =
                    (Browser.mainLoop.currentFrameNumber + 1) | 0;
                if (
                    Browser.mainLoop.timingMode == 1 &&
                    Browser.mainLoop.timingValue > 1 &&
                    Browser.mainLoop.currentFrameNumber %
                        Browser.mainLoop.timingValue !=
                        0
                ) {
                    Browser.mainLoop.scheduler();
                    return;
                } else if (Browser.mainLoop.timingMode == 0) {
                    Browser.mainLoop.tickStartTime = _emscripten_get_now();
                }
                Browser.mainLoop.runIter(browserIterationFunc);
                if (!checkIsRunning()) return;
                if (
                    typeof SDL === 'object' &&
                    SDL.audio &&
                    SDL.audio.queueNewAudioData
                )
                    SDL.audio.queueNewAudioData();
                Browser.mainLoop.scheduler();
            };
            if (!noSetTiming) {
                if (fps && fps > 0)
                    _emscripten_set_main_loop_timing(0, 1e3 / fps);
                else _emscripten_set_main_loop_timing(1, 1);
                Browser.mainLoop.scheduler();
            }
            if (simulateInfiniteLoop) {
                throw 'unwind';
            }
        }
        function callUserCallback(func, synchronous) {
            if (ABORT) {
                return;
            }
            if (synchronous) {
                func();
                return;
            }
            try {
                func();
            } catch (e) {
                if (e instanceof ExitStatus) {
                    return;
                } else if (e !== 'unwind') {
                    if (e && typeof e === 'object' && e.stack)
                        err('exception thrown: ' + [e, e.stack]);
                    throw e;
                }
            }
        }
        var Browser = {
            mainLoop: {
                running: false,
                scheduler: null,
                method: '',
                currentlyRunningMainloop: 0,
                func: null,
                arg: 0,
                timingMode: 0,
                timingValue: 0,
                currentFrameNumber: 0,
                queue: [],
                pause: function () {
                    Browser.mainLoop.scheduler = null;
                    Browser.mainLoop.currentlyRunningMainloop++;
                },
                resume: function () {
                    Browser.mainLoop.currentlyRunningMainloop++;
                    var timingMode = Browser.mainLoop.timingMode;
                    var timingValue = Browser.mainLoop.timingValue;
                    var func = Browser.mainLoop.func;
                    Browser.mainLoop.func = null;
                    setMainLoop(func, 0, false, Browser.mainLoop.arg, true);
                    _emscripten_set_main_loop_timing(timingMode, timingValue);
                    Browser.mainLoop.scheduler();
                },
                updateStatus: function () {
                    if (Module['setStatus']) {
                        var message =
                            Module['statusMessage'] || 'Please wait...';
                        var remaining = Browser.mainLoop.remainingBlockers;
                        var expected = Browser.mainLoop.expectedBlockers;
                        if (remaining) {
                            if (remaining < expected) {
                                Module['setStatus'](
                                    message +
                                        ' (' +
                                        (expected - remaining) +
                                        '/' +
                                        expected +
                                        ')',
                                );
                            } else {
                                Module['setStatus'](message);
                            }
                        } else {
                            Module['setStatus']('');
                        }
                    }
                },
                runIter: function (func) {
                    if (ABORT) return;
                    if (Module['preMainLoop']) {
                        var preRet = Module['preMainLoop']();
                        if (preRet === false) {
                            return;
                        }
                    }
                    callUserCallback(func);
                    if (Module['postMainLoop']) Module['postMainLoop']();
                },
            },
            isFullscreen: false,
            pointerLock: false,
            moduleContextCreatedCallbacks: [],
            workers: [],
            init: function () {
                if (!Module['preloadPlugins']) Module['preloadPlugins'] = [];
                if (Browser.initted) return;
                Browser.initted = true;
                try {
                    new Blob();
                    Browser.hasBlobConstructor = true;
                } catch (e) {
                    Browser.hasBlobConstructor = false;
                    console.log(
                        'warning: no blob constructor, cannot create blobs with mimetypes',
                    );
                }
                Browser.BlobBuilder =
                    typeof MozBlobBuilder != 'undefined'
                        ? MozBlobBuilder
                        : typeof WebKitBlobBuilder != 'undefined'
                          ? WebKitBlobBuilder
                          : !Browser.hasBlobConstructor
                            ? console.log('warning: no BlobBuilder')
                            : null;
                Browser.URLObject =
                    typeof window != 'undefined'
                        ? window.URL
                            ? window.URL
                            : window.webkitURL
                        : undefined;
                if (
                    !Module.noImageDecoding &&
                    typeof Browser.URLObject === 'undefined'
                ) {
                    console.log(
                        'warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.',
                    );
                    Module.noImageDecoding = true;
                }
                var imagePlugin = {};
                imagePlugin['canHandle'] = function imagePlugin_canHandle(
                    name,
                ) {
                    return (
                        !Module.noImageDecoding &&
                        /\.(jpg|jpeg|png|bmp)$/i.test(name)
                    );
                };
                imagePlugin['handle'] = function imagePlugin_handle(
                    byteArray,
                    name,
                    onload,
                    onerror,
                ) {
                    var b = null;
                    if (Browser.hasBlobConstructor) {
                        try {
                            b = new Blob([byteArray], {
                                type: Browser.getMimetype(name),
                            });
                            if (b.size !== byteArray.length) {
                                b = new Blob(
                                    [new Uint8Array(byteArray).buffer],
                                    { type: Browser.getMimetype(name) },
                                );
                            }
                        } catch (e) {
                            warnOnce(
                                'Blob constructor present but fails: ' +
                                    e +
                                    '; falling back to blob builder',
                            );
                        }
                    }
                    if (!b) {
                        var bb = new Browser.BlobBuilder();
                        bb.append(new Uint8Array(byteArray).buffer);
                        b = bb.getBlob();
                    }
                    var url = Browser.URLObject.createObjectURL(b);
                    var img = new Image();
                    img.onload = function img_onload() {
                        assert(
                            img.complete,
                            'Image ' + name + ' could not be decoded',
                        );
                        var canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        var ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        Module['preloadedImages'][name] = canvas;
                        Browser.URLObject.revokeObjectURL(url);
                        if (onload) onload(byteArray);
                    };
                    img.onerror = function img_onerror(event) {
                        console.log('Image ' + url + ' could not be decoded');
                        if (onerror) onerror();
                    };
                    img.src = url;
                };
                Module['preloadPlugins'].push(imagePlugin);
                var audioPlugin = {};
                audioPlugin['canHandle'] = function audioPlugin_canHandle(
                    name,
                ) {
                    return (
                        !Module.noAudioDecoding &&
                        name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 }
                    );
                };
                audioPlugin['handle'] = function audioPlugin_handle(
                    byteArray,
                    name,
                    onload,
                    onerror,
                ) {
                    var done = false;
                    function finish(audio) {
                        if (done) return;
                        done = true;
                        Module['preloadedAudios'][name] = audio;
                        if (onload) onload(byteArray);
                    }
                    function fail() {
                        if (done) return;
                        done = true;
                        Module['preloadedAudios'][name] = new Audio();
                        if (onerror) onerror();
                    }
                    if (Browser.hasBlobConstructor) {
                        try {
                            var b = new Blob([byteArray], {
                                type: Browser.getMimetype(name),
                            });
                        } catch (e) {
                            return fail();
                        }
                        var url = Browser.URLObject.createObjectURL(b);
                        var audio = new Audio();
                        audio.addEventListener(
                            'canplaythrough',
                            function () {
                                finish(audio);
                            },
                            false,
                        );
                        audio.onerror = function audio_onerror(event) {
                            if (done) return;
                            console.log(
                                'warning: browser could not fully decode audio ' +
                                    name +
                                    ', trying slower base64 approach',
                            );
                            function encode64(data) {
                                var BASE =
                                    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                                var PAD = '=';
                                var ret = '';
                                var leftchar = 0;
                                var leftbits = 0;
                                for (var i = 0; i < data.length; i++) {
                                    leftchar = (leftchar << 8) | data[i];
                                    leftbits += 8;
                                    while (leftbits >= 6) {
                                        var curr =
                                            (leftchar >> (leftbits - 6)) & 63;
                                        leftbits -= 6;
                                        ret += BASE[curr];
                                    }
                                }
                                if (leftbits == 2) {
                                    ret += BASE[(leftchar & 3) << 4];
                                    ret += PAD + PAD;
                                } else if (leftbits == 4) {
                                    ret += BASE[(leftchar & 15) << 2];
                                    ret += PAD;
                                }
                                return ret;
                            }
                            audio.src =
                                'data:audio/x-' +
                                name.substr(-3) +
                                ';base64,' +
                                encode64(byteArray);
                            finish(audio);
                        };
                        audio.src = url;
                        Browser.safeSetTimeout(function () {
                            finish(audio);
                        }, 1e4);
                    } else {
                        return fail();
                    }
                };
                Module['preloadPlugins'].push(audioPlugin);
                function pointerLockChange() {
                    Browser.pointerLock =
                        document['pointerLockElement'] === Module['canvas'] ||
                        document['mozPointerLockElement'] ===
                            Module['canvas'] ||
                        document['webkitPointerLockElement'] ===
                            Module['canvas'] ||
                        document['msPointerLockElement'] === Module['canvas'];
                }
                var canvas = Module['canvas'];
                if (canvas) {
                    canvas.requestPointerLock =
                        canvas['requestPointerLock'] ||
                        canvas['mozRequestPointerLock'] ||
                        canvas['webkitRequestPointerLock'] ||
                        canvas['msRequestPointerLock'] ||
                        function () {};
                    canvas.exitPointerLock =
                        document['exitPointerLock'] ||
                        document['mozExitPointerLock'] ||
                        document['webkitExitPointerLock'] ||
                        document['msExitPointerLock'] ||
                        function () {};
                    canvas.exitPointerLock =
                        canvas.exitPointerLock.bind(document);
                    document.addEventListener(
                        'pointerlockchange',
                        pointerLockChange,
                        false,
                    );
                    document.addEventListener(
                        'mozpointerlockchange',
                        pointerLockChange,
                        false,
                    );
                    document.addEventListener(
                        'webkitpointerlockchange',
                        pointerLockChange,
                        false,
                    );
                    document.addEventListener(
                        'mspointerlockchange',
                        pointerLockChange,
                        false,
                    );
                    if (Module['elementPointerLock']) {
                        canvas.addEventListener(
                            'click',
                            function (ev) {
                                if (
                                    !Browser.pointerLock &&
                                    Module['canvas'].requestPointerLock
                                ) {
                                    Module['canvas'].requestPointerLock();
                                    ev.preventDefault();
                                }
                            },
                            false,
                        );
                    }
                }
            },
            createContext: function (
                canvas,
                useWebGL,
                setInModule,
                webGLContextAttributes,
            ) {
                if (useWebGL && Module.ctx && canvas == Module.canvas)
                    return Module.ctx;
                var ctx;
                var contextHandle;
                if (useWebGL) {
                    var contextAttributes = {
                        antialias: false,
                        alpha: false,
                        majorVersion: 1,
                    };
                    if (webGLContextAttributes) {
                        for (var attribute in webGLContextAttributes) {
                            contextAttributes[attribute] =
                                webGLContextAttributes[attribute];
                        }
                    }
                    if (typeof GL !== 'undefined') {
                        contextHandle = GL.createContext(
                            canvas,
                            contextAttributes,
                        );
                        if (contextHandle) {
                            ctx = GL.getContext(contextHandle).GLctx;
                        }
                    }
                } else {
                    ctx = canvas.getContext('2d');
                }
                if (!ctx) return null;
                if (setInModule) {
                    if (!useWebGL)
                        assert(
                            typeof GLctx === 'undefined',
                            'cannot set in module if GLctx is used, but we are a non-GL context that would replace it',
                        );
                    Module.ctx = ctx;
                    if (useWebGL) GL.makeContextCurrent(contextHandle);
                    Module.useWebGL = useWebGL;
                    Browser.moduleContextCreatedCallbacks.forEach(
                        function (callback) {
                            callback();
                        },
                    );
                    Browser.init();
                }
                return ctx;
            },
            destroyContext: function (canvas, useWebGL, setInModule) {},
            fullscreenHandlersInstalled: false,
            lockPointer: undefined,
            resizeCanvas: undefined,
            requestFullscreen: function (lockPointer, resizeCanvas) {
                Browser.lockPointer = lockPointer;
                Browser.resizeCanvas = resizeCanvas;
                if (typeof Browser.lockPointer === 'undefined')
                    Browser.lockPointer = true;
                if (typeof Browser.resizeCanvas === 'undefined')
                    Browser.resizeCanvas = false;
                var canvas = Module['canvas'];
                function fullscreenChange() {
                    Browser.isFullscreen = false;
                    var canvasContainer = canvas.parentNode;
                    if (
                        (document['fullscreenElement'] ||
                            document['mozFullScreenElement'] ||
                            document['msFullscreenElement'] ||
                            document['webkitFullscreenElement'] ||
                            document['webkitCurrentFullScreenElement']) ===
                        canvasContainer
                    ) {
                        canvas.exitFullscreen = Browser.exitFullscreen;
                        if (Browser.lockPointer) canvas.requestPointerLock();
                        Browser.isFullscreen = true;
                        if (Browser.resizeCanvas) {
                            Browser.setFullscreenCanvasSize();
                        } else {
                            Browser.updateCanvasDimensions(canvas);
                        }
                    } else {
                        canvasContainer.parentNode.insertBefore(
                            canvas,
                            canvasContainer,
                        );
                        canvasContainer.parentNode.removeChild(canvasContainer);
                        if (Browser.resizeCanvas) {
                            Browser.setWindowedCanvasSize();
                        } else {
                            Browser.updateCanvasDimensions(canvas);
                        }
                    }
                    if (Module['onFullScreen'])
                        Module['onFullScreen'](Browser.isFullscreen);
                    if (Module['onFullscreen'])
                        Module['onFullscreen'](Browser.isFullscreen);
                }
                if (!Browser.fullscreenHandlersInstalled) {
                    Browser.fullscreenHandlersInstalled = true;
                    document.addEventListener(
                        'fullscreenchange',
                        fullscreenChange,
                        false,
                    );
                    document.addEventListener(
                        'mozfullscreenchange',
                        fullscreenChange,
                        false,
                    );
                    document.addEventListener(
                        'webkitfullscreenchange',
                        fullscreenChange,
                        false,
                    );
                    document.addEventListener(
                        'MSFullscreenChange',
                        fullscreenChange,
                        false,
                    );
                }
                var canvasContainer = document.createElement('div');
                canvas.parentNode.insertBefore(canvasContainer, canvas);
                canvasContainer.appendChild(canvas);
                canvasContainer.requestFullscreen =
                    canvasContainer['requestFullscreen'] ||
                    canvasContainer['mozRequestFullScreen'] ||
                    canvasContainer['msRequestFullscreen'] ||
                    (canvasContainer['webkitRequestFullscreen']
                        ? function () {
                              canvasContainer['webkitRequestFullscreen'](
                                  Element['ALLOW_KEYBOARD_INPUT'],
                              );
                          }
                        : null) ||
                    (canvasContainer['webkitRequestFullScreen']
                        ? function () {
                              canvasContainer['webkitRequestFullScreen'](
                                  Element['ALLOW_KEYBOARD_INPUT'],
                              );
                          }
                        : null);
                canvasContainer.requestFullscreen();
            },
            exitFullscreen: function () {
                if (!Browser.isFullscreen) {
                    return false;
                }
                var CFS =
                    document['exitFullscreen'] ||
                    document['cancelFullScreen'] ||
                    document['mozCancelFullScreen'] ||
                    document['msExitFullscreen'] ||
                    document['webkitCancelFullScreen'] ||
                    function () {};
                CFS.apply(document, []);
                return true;
            },
            nextRAF: 0,
            fakeRequestAnimationFrame: function (func) {
                var now = Date.now();
                if (Browser.nextRAF === 0) {
                    Browser.nextRAF = now + 1e3 / 60;
                } else {
                    while (now + 2 >= Browser.nextRAF) {
                        Browser.nextRAF += 1e3 / 60;
                    }
                }
                var delay = Math.max(Browser.nextRAF - now, 0);
                setTimeout(func, delay);
            },
            requestAnimationFrame: function (func) {
                if (typeof requestAnimationFrame === 'function') {
                    requestAnimationFrame(func);
                    return;
                }
                var RAF = Browser.fakeRequestAnimationFrame;
                RAF(func);
            },
            safeRequestAnimationFrame: function (func) {
                return Browser.requestAnimationFrame(function () {
                    callUserCallback(func);
                });
            },
            safeSetTimeout: function (func, timeout) {
                return setTimeout(function () {
                    callUserCallback(func);
                }, timeout);
            },
            getMimetype: function (name) {
                return {
                    jpg: 'image/jpeg',
                    jpeg: 'image/jpeg',
                    png: 'image/png',
                    bmp: 'image/bmp',
                    ogg: 'audio/ogg',
                    wav: 'audio/wav',
                    mp3: 'audio/mpeg',
                }[name.substr(name.lastIndexOf('.') + 1)];
            },
            getUserMedia: function (func) {
                if (!window.getUserMedia) {
                    window.getUserMedia =
                        navigator['getUserMedia'] ||
                        navigator['mozGetUserMedia'];
                }
                window.getUserMedia(func);
            },
            getMovementX: function (event) {
                return (
                    event['movementX'] ||
                    event['mozMovementX'] ||
                    event['webkitMovementX'] ||
                    0
                );
            },
            getMovementY: function (event) {
                return (
                    event['movementY'] ||
                    event['mozMovementY'] ||
                    event['webkitMovementY'] ||
                    0
                );
            },
            getMouseWheelDelta: function (event) {
                var delta = 0;
                switch (event.type) {
                    case 'DOMMouseScroll':
                        delta = event.detail / 3;
                        break;
                    case 'mousewheel':
                        delta = event.wheelDelta / 120;
                        break;
                    case 'wheel':
                        delta = event.deltaY;
                        switch (event.deltaMode) {
                            case 0:
                                delta /= 100;
                                break;
                            case 1:
                                delta /= 3;
                                break;
                            case 2:
                                delta *= 80;
                                break;
                            default:
                                throw (
                                    'unrecognized mouse wheel delta mode: ' +
                                    event.deltaMode
                                );
                        }
                        break;
                    default:
                        throw 'unrecognized mouse wheel event: ' + event.type;
                }
                return delta;
            },
            mouseX: 0,
            mouseY: 0,
            mouseMovementX: 0,
            mouseMovementY: 0,
            touches: {},
            lastTouches: {},
            calculateMouseEvent: function (event) {
                if (Browser.pointerLock) {
                    if (event.type != 'mousemove' && 'mozMovementX' in event) {
                        Browser.mouseMovementX = Browser.mouseMovementY = 0;
                    } else {
                        Browser.mouseMovementX = Browser.getMovementX(event);
                        Browser.mouseMovementY = Browser.getMovementY(event);
                    }
                    if (typeof SDL != 'undefined') {
                        Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
                        Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
                    } else {
                        Browser.mouseX += Browser.mouseMovementX;
                        Browser.mouseY += Browser.mouseMovementY;
                    }
                } else {
                    var rect = Module['canvas'].getBoundingClientRect();
                    var cw = Module['canvas'].width;
                    var ch = Module['canvas'].height;
                    var scrollX =
                        typeof window.scrollX !== 'undefined'
                            ? window.scrollX
                            : window.pageXOffset;
                    var scrollY =
                        typeof window.scrollY !== 'undefined'
                            ? window.scrollY
                            : window.pageYOffset;
                    if (
                        event.type === 'touchstart' ||
                        event.type === 'touchend' ||
                        event.type === 'touchmove'
                    ) {
                        var touch = event.touch;
                        if (touch === undefined) {
                            return;
                        }
                        var adjustedX = touch.pageX - (scrollX + rect.left);
                        var adjustedY = touch.pageY - (scrollY + rect.top);
                        adjustedX = adjustedX * (cw / rect.width);
                        adjustedY = adjustedY * (ch / rect.height);
                        var coords = { x: adjustedX, y: adjustedY };
                        if (event.type === 'touchstart') {
                            Browser.lastTouches[touch.identifier] = coords;
                            Browser.touches[touch.identifier] = coords;
                        } else if (
                            event.type === 'touchend' ||
                            event.type === 'touchmove'
                        ) {
                            var last = Browser.touches[touch.identifier];
                            if (!last) last = coords;
                            Browser.lastTouches[touch.identifier] = last;
                            Browser.touches[touch.identifier] = coords;
                        }
                        return;
                    }
                    var x = event.pageX - (scrollX + rect.left);
                    var y = event.pageY - (scrollY + rect.top);
                    x = x * (cw / rect.width);
                    y = y * (ch / rect.height);
                    Browser.mouseMovementX = x - Browser.mouseX;
                    Browser.mouseMovementY = y - Browser.mouseY;
                    Browser.mouseX = x;
                    Browser.mouseY = y;
                }
            },
            asyncLoad: function (url, onload, onerror, noRunDep) {
                var dep = !noRunDep ? getUniqueRunDependency('al ' + url) : '';
                readAsync(
                    url,
                    function (arrayBuffer) {
                        assert(
                            arrayBuffer,
                            'Loading data file "' +
                                url +
                                '" failed (no arrayBuffer).',
                        );
                        onload(new Uint8Array(arrayBuffer));
                        if (dep) removeRunDependency(dep);
                    },
                    function (event) {
                        if (onerror) {
                            onerror();
                        } else {
                            throw 'Loading data file "' + url + '" failed.';
                        }
                    },
                );
                if (dep) addRunDependency(dep);
            },
            resizeListeners: [],
            updateResizeListeners: function () {
                var canvas = Module['canvas'];
                Browser.resizeListeners.forEach(function (listener) {
                    listener(canvas.width, canvas.height);
                });
            },
            setCanvasSize: function (width, height, noUpdates) {
                var canvas = Module['canvas'];
                Browser.updateCanvasDimensions(canvas, width, height);
                if (!noUpdates) Browser.updateResizeListeners();
            },
            windowedWidth: 0,
            windowedHeight: 0,
            setFullscreenCanvasSize: function () {
                if (typeof SDL != 'undefined') {
                    var flags = HEAPU32[SDL.screen >> 2];
                    flags = flags | 8388608;
                    HEAP32[SDL.screen >> 2] = flags;
                }
                Browser.updateCanvasDimensions(Module['canvas']);
                Browser.updateResizeListeners();
            },
            setWindowedCanvasSize: function () {
                if (typeof SDL != 'undefined') {
                    var flags = HEAPU32[SDL.screen >> 2];
                    flags = flags & ~8388608;
                    HEAP32[SDL.screen >> 2] = flags;
                }
                Browser.updateCanvasDimensions(Module['canvas']);
                Browser.updateResizeListeners();
            },
            updateCanvasDimensions: function (canvas, wNative, hNative) {
                if (wNative && hNative) {
                    canvas.widthNative = wNative;
                    canvas.heightNative = hNative;
                } else {
                    wNative = canvas.widthNative;
                    hNative = canvas.heightNative;
                }
                var w = wNative;
                var h = hNative;
                if (
                    Module['forcedAspectRatio'] &&
                    Module['forcedAspectRatio'] > 0
                ) {
                    if (w / h < Module['forcedAspectRatio']) {
                        w = Math.round(h * Module['forcedAspectRatio']);
                    } else {
                        h = Math.round(w / Module['forcedAspectRatio']);
                    }
                }
                if (
                    (document['fullscreenElement'] ||
                        document['mozFullScreenElement'] ||
                        document['msFullscreenElement'] ||
                        document['webkitFullscreenElement'] ||
                        document['webkitCurrentFullScreenElement']) ===
                        canvas.parentNode &&
                    typeof screen != 'undefined'
                ) {
                    var factor = Math.min(screen.width / w, screen.height / h);
                    w = Math.round(w * factor);
                    h = Math.round(h * factor);
                }
                if (Browser.resizeCanvas) {
                    if (canvas.width != w) canvas.width = w;
                    if (canvas.height != h) canvas.height = h;
                    if (typeof canvas.style != 'undefined') {
                        canvas.style.removeProperty('width');
                        canvas.style.removeProperty('height');
                    }
                } else {
                    if (canvas.width != wNative) canvas.width = wNative;
                    if (canvas.height != hNative) canvas.height = hNative;
                    if (typeof canvas.style != 'undefined') {
                        if (w != wNative || h != hNative) {
                            canvas.style.setProperty(
                                'width',
                                w + 'px',
                                'important',
                            );
                            canvas.style.setProperty(
                                'height',
                                h + 'px',
                                'important',
                            );
                        } else {
                            canvas.style.removeProperty('width');
                            canvas.style.removeProperty('height');
                        }
                    }
                }
            },
            wgetRequests: {},
            nextWgetRequestHandle: 0,
            getNextWgetRequestHandle: function () {
                var handle = Browser.nextWgetRequestHandle;
                Browser.nextWgetRequestHandle++;
                return handle;
            },
        };
        function _emscripten_async_call(func, arg, millis) {
            function wrapper() {
                (function (a1) {
                    dynCall_vi.apply(null, [func, a1]);
                })(arg);
            }
            if (millis >= 0) {
                Browser.safeSetTimeout(wrapper, millis);
            } else {
                Browser.safeRequestAnimationFrame(wrapper);
            }
        }
        function _emscripten_memcpy_big(dest, src, num) {
            HEAPU8.copyWithin(dest, src, src + num);
        }
        function emscripten_realloc_buffer(size) {
            try {
                wasmMemory.grow((size - buffer.byteLength + 65535) >>> 16);
                updateGlobalBufferAndViews(wasmMemory.buffer);
                return 1;
            } catch (e) {}
        }
        function _emscripten_resize_heap(requestedSize) {
            var oldSize = HEAPU8.length;
            requestedSize = requestedSize >>> 0;
            var maxHeapSize = 2147483648;
            if (requestedSize > maxHeapSize) {
                return false;
            }
            for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
                var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
                overGrownHeapSize = Math.min(
                    overGrownHeapSize,
                    requestedSize + 100663296,
                );
                var newSize = Math.min(
                    maxHeapSize,
                    alignUp(Math.max(requestedSize, overGrownHeapSize), 65536),
                );
                var replacement = emscripten_realloc_buffer(newSize);
                if (replacement) {
                    return true;
                }
            }
            return false;
        }
        function _emscripten_thread_sleep(msecs) {
            var start = _emscripten_get_now();
            while (_emscripten_get_now() - start < msecs) {}
        }
        function _fd_close(fd) {
            try {
                var stream = SYSCALLS.getStreamFromFD(fd);
                FS.close(stream);
                return 0;
            } catch (e) {
                if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError))
                    abort(e);
                return e.errno;
            }
        }
        function _fd_read(fd, iov, iovcnt, pnum) {
            try {
                var stream = SYSCALLS.getStreamFromFD(fd);
                var num = SYSCALLS.doReadv(stream, iov, iovcnt);
                HEAP32[pnum >> 2] = num;
                return 0;
            } catch (e) {
                if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError))
                    abort(e);
                return e.errno;
            }
        }
        function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
            try {
                var stream = SYSCALLS.getStreamFromFD(fd);
                var HIGH_OFFSET = 4294967296;
                var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
                var DOUBLE_LIMIT = 9007199254740992;
                if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
                    return -61;
                }
                FS.llseek(stream, offset, whence);
                ((tempI64 = [
                    stream.position >>> 0,
                    ((tempDouble = stream.position),
                    +Math.abs(tempDouble) >= 1
                        ? tempDouble > 0
                            ? (Math.min(
                                  +Math.floor(tempDouble / 4294967296),
                                  4294967295,
                              ) |
                                  0) >>>
                              0
                            : ~~+Math.ceil(
                                  (tempDouble - +(~~tempDouble >>> 0)) /
                                      4294967296,
                              ) >>> 0
                        : 0),
                ]),
                    (HEAP32[newOffset >> 2] = tempI64[0]),
                    (HEAP32[(newOffset + 4) >> 2] = tempI64[1]));
                if (stream.getdents && offset === 0 && whence === 0)
                    stream.getdents = null;
                return 0;
            } catch (e) {
                if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError))
                    abort(e);
                return e.errno;
            }
        }
        function _fd_write(fd, iov, iovcnt, pnum) {
            try {
                var stream = SYSCALLS.getStreamFromFD(fd);
                var num = SYSCALLS.doWritev(stream, iov, iovcnt);
                HEAP32[pnum >> 2] = num;
                return 0;
            } catch (e) {
                if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError))
                    abort(e);
                return e.errno;
            }
        }
        function _setTempRet0(val) {
            setTempRet0(val);
        }
        function runAndAbortIfError(func) {
            try {
                return func();
            } catch (e) {
                abort(e);
            }
        }
        var Asyncify = {
            State: { Normal: 0, Unwinding: 1, Rewinding: 2 },
            state: 0,
            StackSize: 4096,
            currData: null,
            handleSleepReturnValue: 0,
            exportCallStack: [],
            callStackNameToId: {},
            callStackIdToName: {},
            callStackId: 0,
            afterUnwind: null,
            asyncFinalizers: [],
            sleepCallbacks: [],
            getCallStackId: function (funcName) {
                var id = Asyncify.callStackNameToId[funcName];
                if (id === undefined) {
                    id = Asyncify.callStackId++;
                    Asyncify.callStackNameToId[funcName] = id;
                    Asyncify.callStackIdToName[id] = funcName;
                }
                return id;
            },
            instrumentWasmExports: function (exports) {
                var ret = {};
                for (var x in exports) {
                    (function (x) {
                        var original = exports[x];
                        if (typeof original === 'function') {
                            ret[x] = function () {
                                Asyncify.exportCallStack.push(x);
                                try {
                                    return original.apply(null, arguments);
                                } finally {
                                    if (ABORT) return;
                                    var y = Asyncify.exportCallStack.pop();
                                    assert(y === x);
                                    Asyncify.maybeStopUnwind();
                                }
                            };
                        } else {
                            ret[x] = original;
                        }
                    })(x);
                }
                return ret;
            },
            maybeStopUnwind: function () {
                if (
                    Asyncify.currData &&
                    Asyncify.state === Asyncify.State.Unwinding &&
                    Asyncify.exportCallStack.length === 0
                ) {
                    Asyncify.state = Asyncify.State.Normal;
                    runAndAbortIfError(Module['_asyncify_stop_unwind']);
                    if (typeof Fibers !== 'undefined') {
                        Fibers.trampoline();
                    }
                    if (Asyncify.afterUnwind) {
                        Asyncify.afterUnwind();
                        Asyncify.afterUnwind = null;
                    }
                }
            },
            allocateData: function () {
                var ptr = _malloc(12 + Asyncify.StackSize);
                Asyncify.setDataHeader(ptr, ptr + 12, Asyncify.StackSize);
                Asyncify.setDataRewindFunc(ptr);
                return ptr;
            },
            setDataHeader: function (ptr, stack, stackSize) {
                HEAP32[ptr >> 2] = stack;
                HEAP32[(ptr + 4) >> 2] = stack + stackSize;
            },
            setDataRewindFunc: function (ptr) {
                var bottomOfCallStack = Asyncify.exportCallStack[0];
                var rewindId = Asyncify.getCallStackId(bottomOfCallStack);
                HEAP32[(ptr + 8) >> 2] = rewindId;
            },
            getDataRewindFunc: function (ptr) {
                var id = HEAP32[(ptr + 8) >> 2];
                var name = Asyncify.callStackIdToName[id];
                var func = Module['asm'][name];
                return func;
            },
            handleSleep: function (startAsync) {
                if (ABORT) return;
                noExitRuntime = true;
                if (Asyncify.state === Asyncify.State.Normal) {
                    var reachedCallback = false;
                    var reachedAfterCallback = false;
                    startAsync(function (handleSleepReturnValue) {
                        if (ABORT) return;
                        Asyncify.handleSleepReturnValue =
                            handleSleepReturnValue || 0;
                        reachedCallback = true;
                        if (!reachedAfterCallback) {
                            return;
                        }
                        Asyncify.state = Asyncify.State.Rewinding;
                        runAndAbortIfError(function () {
                            Module['_asyncify_start_rewind'](Asyncify.currData);
                        });
                        if (
                            typeof Browser !== 'undefined' &&
                            Browser.mainLoop.func
                        ) {
                            Browser.mainLoop.resume();
                        }
                        var start = Asyncify.getDataRewindFunc(
                            Asyncify.currData,
                        );
                        var asyncWasmReturnValue = start();
                        if (!Asyncify.currData) {
                            var asyncFinalizers = Asyncify.asyncFinalizers;
                            Asyncify.asyncFinalizers = [];
                            asyncFinalizers.forEach(function (func) {
                                func(asyncWasmReturnValue);
                            });
                        }
                    });
                    reachedAfterCallback = true;
                    if (!reachedCallback) {
                        Asyncify.state = Asyncify.State.Unwinding;
                        Asyncify.currData = Asyncify.allocateData();
                        runAndAbortIfError(function () {
                            Module['_asyncify_start_unwind'](Asyncify.currData);
                        });
                        if (
                            typeof Browser !== 'undefined' &&
                            Browser.mainLoop.func
                        ) {
                            Browser.mainLoop.pause();
                        }
                    }
                } else if (Asyncify.state === Asyncify.State.Rewinding) {
                    Asyncify.state = Asyncify.State.Normal;
                    runAndAbortIfError(Module['_asyncify_stop_rewind']);
                    _free(Asyncify.currData);
                    Asyncify.currData = null;
                    Asyncify.sleepCallbacks.forEach(function (func) {
                        func();
                    });
                } else {
                    abort('invalid state: ' + Asyncify.state);
                }
                return Asyncify.handleSleepReturnValue;
            },
            handleAsync: function (startAsync) {
                return Asyncify.handleSleep(function (wakeUp) {
                    startAsync().then(wakeUp);
                });
            },
        };
        var FSNode = function (parent, name, mode, rdev) {
            if (!parent) {
                parent = this;
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
        };
        var readMode = 292 | 73;
        var writeMode = 146;
        Object.defineProperties(FSNode.prototype, {
            read: {
                get: function () {
                    return (this.mode & readMode) === readMode;
                },
                set: function (val) {
                    val ? (this.mode |= readMode) : (this.mode &= ~readMode);
                },
            },
            write: {
                get: function () {
                    return (this.mode & writeMode) === writeMode;
                },
                set: function (val) {
                    val ? (this.mode |= writeMode) : (this.mode &= ~writeMode);
                },
            },
            isFolder: {
                get: function () {
                    return FS.isDir(this.mode);
                },
            },
            isDevice: {
                get: function () {
                    return FS.isChrdev(this.mode);
                },
            },
        });
        FS.FSNode = FSNode;
        FS.staticInit();
        Module['FS_createPath'] = FS.createPath;
        Module['FS_createDataFile'] = FS.createDataFile;
        Module['FS_createPreloadedFile'] = FS.createPreloadedFile;
        Module['FS_createLazyFile'] = FS.createLazyFile;
        Module['FS_createDevice'] = FS.createDevice;
        Module['FS_unlink'] = FS.unlink;
        embind_init_charCodes();
        BindingError = Module['BindingError'] = extendError(
            Error,
            'BindingError',
        );
        InternalError = Module['InternalError'] = extendError(
            Error,
            'InternalError',
        );
        init_ClassHandle();
        init_RegisteredPointer();
        init_embind();
        UnboundTypeError = Module['UnboundTypeError'] = extendError(
            Error,
            'UnboundTypeError',
        );
        init_emval();
        Module['requestFullscreen'] = function Module_requestFullscreen(
            lockPointer,
            resizeCanvas,
        ) {
            Browser.requestFullscreen(lockPointer, resizeCanvas);
        };
        Module['requestAnimationFrame'] = function Module_requestAnimationFrame(
            func,
        ) {
            Browser.requestAnimationFrame(func);
        };
        Module['setCanvasSize'] = function Module_setCanvasSize(
            width,
            height,
            noUpdates,
        ) {
            Browser.setCanvasSize(width, height, noUpdates);
        };
        Module['pauseMainLoop'] = function Module_pauseMainLoop() {
            Browser.mainLoop.pause();
        };
        Module['resumeMainLoop'] = function Module_resumeMainLoop() {
            Browser.mainLoop.resume();
        };
        Module['getUserMedia'] = function Module_getUserMedia() {
            Browser.getUserMedia();
        };
        Module['createContext'] = function Module_createContext(
            canvas,
            useWebGL,
            setInModule,
            webGLContextAttributes,
        ) {
            return Browser.createContext(
                canvas,
                useWebGL,
                setInModule,
                webGLContextAttributes,
            );
        };
        function intArrayFromString(stringy, dontAddNull, length) {
            var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
            var u8array = new Array(len);
            var numBytesWritten = stringToUTF8Array(
                stringy,
                u8array,
                0,
                u8array.length,
            );
            if (dontAddNull) u8array.length = numBytesWritten;
            return u8array;
        }
        var asmLibraryArg = {
            q: ___sys_fcntl64,
            F: ___sys_ioctl,
            G: ___sys_open,
            A: __embind_register_bigint,
            I: __embind_register_bool,
            e: __embind_register_class,
            a: __embind_register_class_function,
            j: __embind_register_constant,
            H: __embind_register_emval,
            s: __embind_register_float,
            g: __embind_register_function,
            i: __embind_register_integer,
            h: __embind_register_memory_view,
            t: __embind_register_std_string,
            l: __embind_register_std_wstring,
            J: __embind_register_void,
            f: __emval_as,
            O: __emval_call,
            m: __emval_decref,
            K: __emval_get_module_property,
            n: __emval_get_property,
            k: __emval_incref,
            w: __emval_new_array,
            M: __emval_new_cstring,
            N: __emval_new_object,
            L: __emval_run_destructors,
            b: __emval_set_property,
            c: __emval_take_value,
            z: __emval_typeof,
            u: _abort,
            d: _emscripten_asm_const_int,
            x: _emscripten_async_call,
            v: _emscripten_get_now,
            B: _emscripten_memcpy_big,
            C: _emscripten_resize_heap,
            D: _emscripten_thread_sleep,
            r: _fd_close,
            E: _fd_read,
            y: _fd_seek,
            p: _fd_write,
            o: _setTempRet0,
        };
        var asm = createWasm();
        var ___wasm_call_ctors = (Module['___wasm_call_ctors'] = function () {
            return (___wasm_call_ctors = Module['___wasm_call_ctors'] =
                Module['asm']['Q']).apply(null, arguments);
        });
        var _malloc = (Module['_malloc'] = function () {
            return (_malloc = Module['_malloc'] = Module['asm']['S']).apply(
                null,
                arguments,
            );
        });
        var _free = (Module['_free'] = function () {
            return (_free = Module['_free'] = Module['asm']['T']).apply(
                null,
                arguments,
            );
        });
        var _FMOD_JS_MixFunction = (Module['_FMOD_JS_MixFunction'] =
            function () {
                return (_FMOD_JS_MixFunction = Module['_FMOD_JS_MixFunction'] =
                    Module['asm']['U']).apply(null, arguments);
            });
        var _FMOD_JS_MixerSlowpathFunction = (Module[
            '_FMOD_JS_MixerSlowpathFunction'
        ] = function () {
            return (_FMOD_JS_MixerSlowpathFunction = Module[
                '_FMOD_JS_MixerSlowpathFunction'
            ] =
                Module['asm']['V']).apply(null, arguments);
        });
        var _FMOD_JS_MixerFastpathFunction = (Module[
            '_FMOD_JS_MixerFastpathFunction'
        ] = function () {
            return (_FMOD_JS_MixerFastpathFunction = Module[
                '_FMOD_JS_MixerFastpathFunction'
            ] =
                Module['asm']['W']).apply(null, arguments);
        });
        var ___getTypeName = (Module['___getTypeName'] = function () {
            return (___getTypeName = Module['___getTypeName'] =
                Module['asm']['X']).apply(null, arguments);
        });
        var ___embind_register_native_and_builtin_types = (Module[
            '___embind_register_native_and_builtin_types'
        ] = function () {
            return (___embind_register_native_and_builtin_types = Module[
                '___embind_register_native_and_builtin_types'
            ] =
                Module['asm']['Y']).apply(null, arguments);
        });
        var ___errno_location = (Module['___errno_location'] = function () {
            return (___errno_location = Module['___errno_location'] =
                Module['asm']['Z']).apply(null, arguments);
        });
        var stackSave = (Module['stackSave'] = function () {
            return (stackSave = Module['stackSave'] = Module['asm']['_']).apply(
                null,
                arguments,
            );
        });
        var stackRestore = (Module['stackRestore'] = function () {
            return (stackRestore = Module['stackRestore'] =
                Module['asm']['$']).apply(null, arguments);
        });
        var stackAlloc = (Module['stackAlloc'] = function () {
            return (stackAlloc = Module['stackAlloc'] =
                Module['asm']['aa']).apply(null, arguments);
        });
        var dynCall_iiiii = (Module['dynCall_iiiii'] = function () {
            return (dynCall_iiiii = Module['dynCall_iiiii'] =
                Module['asm']['ba']).apply(null, arguments);
        });
        var dynCall_v = (Module['dynCall_v'] = function () {
            return (dynCall_v = Module['dynCall_v'] =
                Module['asm']['ca']).apply(null, arguments);
        });
        var dynCall_iiii = (Module['dynCall_iiii'] = function () {
            return (dynCall_iiii = Module['dynCall_iiii'] =
                Module['asm']['da']).apply(null, arguments);
        });
        var dynCall_ii = (Module['dynCall_ii'] = function () {
            return (dynCall_ii = Module['dynCall_ii'] =
                Module['asm']['ea']).apply(null, arguments);
        });
        var dynCall_vi = (Module['dynCall_vi'] = function () {
            return (dynCall_vi = Module['dynCall_vi'] =
                Module['asm']['fa']).apply(null, arguments);
        });
        var dynCall_iii = (Module['dynCall_iii'] = function () {
            return (dynCall_iii = Module['dynCall_iii'] =
                Module['asm']['ga']).apply(null, arguments);
        });
        var dynCall_iiiiii = (Module['dynCall_iiiiii'] = function () {
            return (dynCall_iiiiii = Module['dynCall_iiiiii'] =
                Module['asm']['ha']).apply(null, arguments);
        });
        var dynCall_iiif = (Module['dynCall_iiif'] = function () {
            return (dynCall_iiif = Module['dynCall_iiif'] =
                Module['asm']['ia']).apply(null, arguments);
        });
        var dynCall_vii = (Module['dynCall_vii'] = function () {
            return (dynCall_vii = Module['dynCall_vii'] =
                Module['asm']['ja']).apply(null, arguments);
        });
        var dynCall_iiifj = (Module['dynCall_iiifj'] = function () {
            return (dynCall_iiifj = Module['dynCall_iiifj'] =
                Module['asm']['ka']).apply(null, arguments);
        });
        var dynCall_fii = (Module['dynCall_fii'] = function () {
            return (dynCall_fii = Module['dynCall_fii'] =
                Module['asm']['la']).apply(null, arguments);
        });
        var dynCall_iif = (Module['dynCall_iif'] = function () {
            return (dynCall_iif = Module['dynCall_iif'] =
                Module['asm']['ma']).apply(null, arguments);
        });
        var dynCall_fiii = (Module['dynCall_fiii'] = function () {
            return (dynCall_fiii = Module['dynCall_fiii'] =
                Module['asm']['na']).apply(null, arguments);
        });
        var dynCall_iiiiiii = (Module['dynCall_iiiiiii'] = function () {
            return (dynCall_iiiiiii = Module['dynCall_iiiiiii'] =
                Module['asm']['oa']).apply(null, arguments);
        });
        var dynCall_iiji = (Module['dynCall_iiji'] = function () {
            return (dynCall_iiji = Module['dynCall_iiji'] =
                Module['asm']['pa']).apply(null, arguments);
        });
        var dynCall_fi = (Module['dynCall_fi'] = function () {
            return (dynCall_fi = Module['dynCall_fi'] =
                Module['asm']['qa']).apply(null, arguments);
        });
        var dynCall_iij = (Module['dynCall_iij'] = function () {
            return (dynCall_iij = Module['dynCall_iij'] =
                Module['asm']['ra']).apply(null, arguments);
        });
        var dynCall_iiiff = (Module['dynCall_iiiff'] = function () {
            return (dynCall_iiiff = Module['dynCall_iiiff'] =
                Module['asm']['sa']).apply(null, arguments);
        });
        var dynCall_ji = (Module['dynCall_ji'] = function () {
            return (dynCall_ji = Module['dynCall_ji'] =
                Module['asm']['ta']).apply(null, arguments);
        });
        var dynCall_iijjifi = (Module['dynCall_iijjifi'] = function () {
            return (dynCall_iijjifi = Module['dynCall_iijjifi'] =
                Module['asm']['ua']).apply(null, arguments);
        });
        var dynCall_iijjifii = (Module['dynCall_iijjifii'] = function () {
            return (dynCall_iijjifii = Module['dynCall_iijjifii'] =
                Module['asm']['va']).apply(null, arguments);
        });
        var dynCall_iijj = (Module['dynCall_iijj'] = function () {
            return (dynCall_iijj = Module['dynCall_iijj'] =
                Module['asm']['wa']).apply(null, arguments);
        });
        var dynCall_iiiiiiii = (Module['dynCall_iiiiiiii'] = function () {
            return (dynCall_iiiiiiii = Module['dynCall_iiiiiiii'] =
                Module['asm']['xa']).apply(null, arguments);
        });
        var dynCall_iiff = (Module['dynCall_iiff'] = function () {
            return (dynCall_iiff = Module['dynCall_iiff'] =
                Module['asm']['ya']).apply(null, arguments);
        });
        var dynCall_iifi = (Module['dynCall_iifi'] = function () {
            return (dynCall_iifi = Module['dynCall_iifi'] =
                Module['asm']['za']).apply(null, arguments);
        });
        var dynCall_iiffffffff = (Module['dynCall_iiffffffff'] = function () {
            return (dynCall_iiffffffff = Module['dynCall_iiffffffff'] =
                Module['asm']['Aa']).apply(null, arguments);
        });
        var dynCall_iijji = (Module['dynCall_iijji'] = function () {
            return (dynCall_iijji = Module['dynCall_iijji'] =
                Module['asm']['Ba']).apply(null, arguments);
        });
        var dynCall_iijf = (Module['dynCall_iijf'] = function () {
            return (dynCall_iijf = Module['dynCall_iijf'] =
                Module['asm']['Ca']).apply(null, arguments);
        });
        var dynCall_iifff = (Module['dynCall_iifff'] = function () {
            return (dynCall_iifff = Module['dynCall_iifff'] =
                Module['asm']['Da']).apply(null, arguments);
        });
        var dynCall_iiffi = (Module['dynCall_iiffi'] = function () {
            return (dynCall_iiffi = Module['dynCall_iiffi'] =
                Module['asm']['Ea']).apply(null, arguments);
        });
        var dynCall_iiiiiiiiii = (Module['dynCall_iiiiiiiiii'] = function () {
            return (dynCall_iiiiiiiiii = Module['dynCall_iiiiiiiiii'] =
                Module['asm']['Fa']).apply(null, arguments);
        });
        var dynCall_viiiiii = (Module['dynCall_viiiiii'] = function () {
            return (dynCall_viiiiii = Module['dynCall_viiiiii'] =
                Module['asm']['Ga']).apply(null, arguments);
        });
        var dynCall_viii = (Module['dynCall_viii'] = function () {
            return (dynCall_viii = Module['dynCall_viii'] =
                Module['asm']['Ha']).apply(null, arguments);
        });
        var dynCall_iiiffi = (Module['dynCall_iiiffi'] = function () {
            return (dynCall_iiiffi = Module['dynCall_iiiffi'] =
                Module['asm']['Ia']).apply(null, arguments);
        });
        var dynCall_iiifffii = (Module['dynCall_iiifffii'] = function () {
            return (dynCall_iiifffii = Module['dynCall_iiifffii'] =
                Module['asm']['Ja']).apply(null, arguments);
        });
        var dynCall_iiiifffffiii = (Module['dynCall_iiiifffffiii'] =
            function () {
                return (dynCall_iiiifffffiii = Module['dynCall_iiiifffffiii'] =
                    Module['asm']['Ka']).apply(null, arguments);
            });
        var dynCall_iiiffffii = (Module['dynCall_iiiffffii'] = function () {
            return (dynCall_iiiffffii = Module['dynCall_iiiffffii'] =
                Module['asm']['La']).apply(null, arguments);
        });
        var dynCall_iiifffffii = (Module['dynCall_iiifffffii'] = function () {
            return (dynCall_iiifffffii = Module['dynCall_iiifffffii'] =
                Module['asm']['Ma']).apply(null, arguments);
        });
        var dynCall_iiifffi = (Module['dynCall_iiifffi'] = function () {
            return (dynCall_iiifffi = Module['dynCall_iiifffi'] =
                Module['asm']['Na']).apply(null, arguments);
        });
        var dynCall_viiii = (Module['dynCall_viiii'] = function () {
            return (dynCall_viiii = Module['dynCall_viiii'] =
                Module['asm']['Oa']).apply(null, arguments);
        });
        var dynCall_viiiiiiffffff = (Module['dynCall_viiiiiiffffff'] =
            function () {
                return (dynCall_viiiiiiffffff = Module[
                    'dynCall_viiiiiiffffff'
                ] =
                    Module['asm']['Pa']).apply(null, arguments);
            });
        var dynCall_viiiiiii = (Module['dynCall_viiiiiii'] = function () {
            return (dynCall_viiiiiii = Module['dynCall_viiiiiii'] =
                Module['asm']['Qa']).apply(null, arguments);
        });
        var dynCall_viiiiif = (Module['dynCall_viiiiif'] = function () {
            return (dynCall_viiiiif = Module['dynCall_viiiiif'] =
                Module['asm']['Ra']).apply(null, arguments);
        });
        var dynCall_iiiiffi = (Module['dynCall_iiiiffi'] = function () {
            return (dynCall_iiiiffi = Module['dynCall_iiiiffi'] =
                Module['asm']['Sa']).apply(null, arguments);
        });
        var dynCall_iiiiiiiiiiiii = (Module['dynCall_iiiiiiiiiiiii'] =
            function () {
                return (dynCall_iiiiiiiiiiiii = Module[
                    'dynCall_iiiiiiiiiiiii'
                ] =
                    Module['asm']['Ta']).apply(null, arguments);
            });
        var dynCall_iiiiiffi = (Module['dynCall_iiiiiffi'] = function () {
            return (dynCall_iiiiiffi = Module['dynCall_iiiiiffi'] =
                Module['asm']['Ua']).apply(null, arguments);
        });
        var dynCall_viiiiiiiifffii = (Module['dynCall_viiiiiiiifffii'] =
            function () {
                return (dynCall_viiiiiiiifffii = Module[
                    'dynCall_viiiiiiiifffii'
                ] =
                    Module['asm']['Va']).apply(null, arguments);
            });
        var dynCall_fif = (Module['dynCall_fif'] = function () {
            return (dynCall_fif = Module['dynCall_fif'] =
                Module['asm']['Wa']).apply(null, arguments);
        });
        var dynCall_viiiii = (Module['dynCall_viiiii'] = function () {
            return (dynCall_viiiii = Module['dynCall_viiiii'] =
                Module['asm']['Xa']).apply(null, arguments);
        });
        var dynCall_viiiiiiiiifff = (Module['dynCall_viiiiiiiiifff'] =
            function () {
                return (dynCall_viiiiiiiiifff = Module[
                    'dynCall_viiiiiiiiifff'
                ] =
                    Module['asm']['Ya']).apply(null, arguments);
            });
        var dynCall_iiiiiiiiiiii = (Module['dynCall_iiiiiiiiiiii'] =
            function () {
                return (dynCall_iiiiiiiiiiii = Module['dynCall_iiiiiiiiiiii'] =
                    Module['asm']['Za']).apply(null, arguments);
            });
        var dynCall_iiiiiiiii = (Module['dynCall_iiiiiiiii'] = function () {
            return (dynCall_iiiiiiiii = Module['dynCall_iiiiiiiii'] =
                Module['asm']['_a']).apply(null, arguments);
        });
        var dynCall_iiidii = (Module['dynCall_iiidii'] = function () {
            return (dynCall_iiidii = Module['dynCall_iiidii'] =
                Module['asm']['$a']).apply(null, arguments);
        });
        var dynCall_iiifff = (Module['dynCall_iiifff'] = function () {
            return (dynCall_iiifff = Module['dynCall_iiifff'] =
                Module['asm']['ab']).apply(null, arguments);
        });
        var dynCall_iiiidii = (Module['dynCall_iiiidii'] = function () {
            return (dynCall_iiiidii = Module['dynCall_iiiidii'] =
                Module['asm']['bb']).apply(null, arguments);
        });
        var dynCall_iiifi = (Module['dynCall_iiifi'] = function () {
            return (dynCall_iiifi = Module['dynCall_iiifi'] =
                Module['asm']['cb']).apply(null, arguments);
        });
        var dynCall_iiiif = (Module['dynCall_iiiif'] = function () {
            return (dynCall_iiiif = Module['dynCall_iiiif'] =
                Module['asm']['db']).apply(null, arguments);
        });
        var dynCall_iiddi = (Module['dynCall_iiddi'] = function () {
            return (dynCall_iiddi = Module['dynCall_iiddi'] =
                Module['asm']['eb']).apply(null, arguments);
        });
        var dynCall_iidf = (Module['dynCall_iidf'] = function () {
            return (dynCall_iidf = Module['dynCall_iidf'] =
                Module['asm']['fb']).apply(null, arguments);
        });
        var dynCall_iidd = (Module['dynCall_iidd'] = function () {
            return (dynCall_iidd = Module['dynCall_iidd'] =
                Module['asm']['gb']).apply(null, arguments);
        });
        var dynCall_iiiffffffff = (Module['dynCall_iiiffffffff'] = function () {
            return (dynCall_iiiffffffff = Module['dynCall_iiiffffffff'] =
                Module['asm']['hb']).apply(null, arguments);
        });
        var dynCall_iiiddi = (Module['dynCall_iiiddi'] = function () {
            return (dynCall_iiiddi = Module['dynCall_iiiddi'] =
                Module['asm']['ib']).apply(null, arguments);
        });
        var dynCall_iiidf = (Module['dynCall_iiidf'] = function () {
            return (dynCall_iiidf = Module['dynCall_iiidf'] =
                Module['asm']['jb']).apply(null, arguments);
        });
        var dynCall_iiidd = (Module['dynCall_iiidd'] = function () {
            return (dynCall_iiidd = Module['dynCall_iiidd'] =
                Module['asm']['kb']).apply(null, arguments);
        });
        var dynCall_iiiiff = (Module['dynCall_iiiiff'] = function () {
            return (dynCall_iiiiff = Module['dynCall_iiiiff'] =
                Module['asm']['lb']).apply(null, arguments);
        });
        var dynCall_iiiifi = (Module['dynCall_iiiifi'] = function () {
            return (dynCall_iiiifi = Module['dynCall_iiiifi'] =
                Module['asm']['mb']).apply(null, arguments);
        });
        var dynCall_iidiiii = (Module['dynCall_iidiiii'] = function () {
            return (dynCall_iidiiii = Module['dynCall_iidiiii'] =
                Module['asm']['nb']).apply(null, arguments);
        });
        var dynCall_jiji = (Module['dynCall_jiji'] = function () {
            return (dynCall_jiji = Module['dynCall_jiji'] =
                Module['asm']['ob']).apply(null, arguments);
        });
        var _asyncify_start_unwind = (Module['_asyncify_start_unwind'] =
            function () {
                return (_asyncify_start_unwind = Module[
                    '_asyncify_start_unwind'
                ] =
                    Module['asm']['pb']).apply(null, arguments);
            });
        var _asyncify_stop_unwind = (Module['_asyncify_stop_unwind'] =
            function () {
                return (_asyncify_stop_unwind = Module[
                    '_asyncify_stop_unwind'
                ] =
                    Module['asm']['qb']).apply(null, arguments);
            });
        var _asyncify_start_rewind = (Module['_asyncify_start_rewind'] =
            function () {
                return (_asyncify_start_rewind = Module[
                    '_asyncify_start_rewind'
                ] =
                    Module['asm']['rb']).apply(null, arguments);
            });
        var _asyncify_stop_rewind = (Module['_asyncify_stop_rewind'] =
            function () {
                return (_asyncify_stop_rewind = Module[
                    '_asyncify_stop_rewind'
                ] =
                    Module['asm']['sb']).apply(null, arguments);
            });
        Module['cwrap'] = cwrap;
        Module['setValue'] = setValue;
        Module['getValue'] = getValue;
        Module['addRunDependency'] = addRunDependency;
        Module['removeRunDependency'] = removeRunDependency;
        Module['FS_createPath'] = FS.createPath;
        Module['FS_createDataFile'] = FS.createDataFile;
        Module['FS_createPreloadedFile'] = FS.createPreloadedFile;
        Module['FS_createLazyFile'] = FS.createLazyFile;
        Module['FS_createDevice'] = FS.createDevice;
        Module['FS_unlink'] = FS.unlink;
        var calledRun;
        function ExitStatus(status) {
            this.name = 'ExitStatus';
            this.message = 'Program terminated with exit(' + status + ')';
            this.status = status;
        }
        dependenciesFulfilled = function runCaller() {
            if (!calledRun) run();
            if (!calledRun) dependenciesFulfilled = runCaller;
        };
        function run(args) {
            args = args || arguments_;
            if (runDependencies > 0) {
                return;
            }
            preRun();
            if (runDependencies > 0) {
                return;
            }
            function doRun() {
                if (calledRun) return;
                calledRun = true;
                Module['calledRun'] = true;
                if (ABORT) return;
                initRuntime();
                readyPromiseResolve(Module);
                if (Module['onRuntimeInitialized'])
                    Module['onRuntimeInitialized']();
                postRun();
            }
            if (Module['setStatus']) {
                Module['setStatus']('Running...');
                setTimeout(function () {
                    setTimeout(function () {
                        Module['setStatus']('');
                    }, 1);
                    doRun();
                }, 1);
            } else {
                doRun();
            }
        }
        Module['run'] = run;
        function exit(status, implicit) {
            EXITSTATUS = status;
            if (implicit && keepRuntimeAlive() && status === 0) {
                return;
            }
            if (keepRuntimeAlive()) {
            } else {
                exitRuntime();
                if (Module['onExit']) Module['onExit'](status);
                ABORT = true;
            }
            quit_(status, new ExitStatus(status));
        }
        if (Module['preInit']) {
            if (typeof Module['preInit'] == 'function')
                Module['preInit'] = [Module['preInit']];
            while (Module['preInit'].length > 0) {
                Module['preInit'].pop()();
            }
        }
        run();

        return FMODModule.ready;
    };
})();
if (typeof exports === 'object' && typeof module === 'object')
    module.exports = FMODModule;
else if (typeof define === 'function' && define['amd'])
    define([], function () {
        return FMODModule;
    });
else if (typeof exports === 'object') exports['FMODModule'] = FMODModule;
