import { hasChanged, isObject } from "../shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

class RefImpl {
    private _value;
    private _rawValue;
    public _v_isRef = true;
    public dep;
    constructor(value) {
        this._rawValue = value;
        this._value = convert(value);
        //1.看看value是否是对象 value -> reactive

        this.dep = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(newValue, this._rawValue)) {
            this._rawValue = newValue;
            this._value = convert(newValue);
            triggerEffects(this.dep);
        }
    }
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
export function ref(value) {
    return new RefImpl(value);
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}

export function isRef(ref) {
    return !!ref._v_isRef;
}
export function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}

export function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            //set -> ref .value 
            //set -> unref 
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            } else {
                return Reflect.set(target, key, value);
            }
        }
    });
}