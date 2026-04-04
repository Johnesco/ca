/* @ts-self-types="./ca.d.ts" */

/**
 * @enum {0 | 1 | 2 | 3 | 4}
 */
export const CaKind = Object.freeze({
    LifeLike: 0, "0": "LifeLike",
    Elementary: 1, "1": "Elementary",
    BriansBrain: 2, "2": "BriansBrain",
    Wireworld: 3, "3": "Wireworld",
    Cyclic: 4, "4": "Cyclic",
});

export class Universe {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        UniverseFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_universe_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    cells_ptr() {
        const ret = wasm.universe_cells_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    clear() {
        wasm.universe_clear(this.__wbg_ptr);
    }
    /**
     * @returns {number}
     */
    height() {
        const ret = wasm.universe_height(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {CaKind}
     */
    kind() {
        const ret = wasm.universe_kind(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    max_state() {
        const ret = wasm.universe_max_state(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} width
     * @param {number} height
     */
    constructor(width, height) {
        const ret = wasm.universe_new(width, height);
        this.__wbg_ptr = ret >>> 0;
        UniverseFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {number} seed
     */
    randomize(seed) {
        wasm.universe_randomize(this.__wbg_ptr, seed);
    }
    set_brians_brain() {
        wasm.universe_set_brians_brain(this.__wbg_ptr);
    }
    /**
     * @param {number} row
     * @param {number} col
     * @param {number} state
     */
    set_cell(row, col, state) {
        wasm.universe_set_cell(this.__wbg_ptr, row, col, state);
    }
    /**
     * @param {number} num_states
     * @param {number} threshold
     */
    set_cyclic(num_states, threshold) {
        wasm.universe_set_cyclic(this.__wbg_ptr, num_states, threshold);
    }
    /**
     * @param {number} rule
     */
    set_elementary(rule) {
        wasm.universe_set_elementary(this.__wbg_ptr, rule);
    }
    /**
     * @param {number} birth
     * @param {number} survival
     */
    set_life_like(birth, survival) {
        wasm.universe_set_life_like(this.__wbg_ptr, birth, survival);
    }
    set_wireworld() {
        wasm.universe_set_wireworld(this.__wbg_ptr);
    }
    tick() {
        wasm.universe_tick(this.__wbg_ptr);
    }
    /**
     * @param {number} row
     * @param {number} col
     */
    toggle_cell(row, col) {
        wasm.universe_toggle_cell(this.__wbg_ptr, row, col);
    }
    /**
     * @param {number} num_states
     * @param {number} threshold
     */
    update_cyclic(num_states, threshold) {
        wasm.universe_update_cyclic(this.__wbg_ptr, num_states, threshold);
    }
    /**
     * @param {number} rule
     */
    update_elementary(rule) {
        wasm.universe_update_elementary(this.__wbg_ptr, rule);
    }
    /**
     * @param {number} birth
     * @param {number} survival
     */
    update_life_like(birth, survival) {
        wasm.universe_update_life_like(this.__wbg_ptr, birth, survival);
    }
    /**
     * @returns {number}
     */
    width() {
        const ret = wasm.universe_width(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) Universe.prototype[Symbol.dispose] = Universe.prototype.free;

function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_throw_81fc77679af83bc6: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./ca_bg.js": import0,
    };
}

const UniverseFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_universe_free(ptr >>> 0, 1));

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let wasmModule, wasm;
function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    wasmModule = module;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('ca_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
