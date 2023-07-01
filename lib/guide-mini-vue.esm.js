const Fragment = Symbol("Fragment");
const Text$1 = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        component: null,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
        el: null
    };
    if (typeof children === "string") {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === 'object') {
            vnode.shapeFlag = 16 /* ShapeFlags.SLOT_CHILDRE */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text$1, {}, text);
}
function getShapeFlag(type) {
    return typeof type === 'string' ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === 'function') {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

const toDisplayString = (val) => {
    return String(val);
};

const extend = Object.assign;
const EMPTY_OBJ = {};
const isObject = (val) => {
    return val !== null && typeof val == 'object';
};
const isString = (val) => typeof val === 'string';
const hasChanged = (val, newVal) => {
    return !Object.is(val, newVal);
};
const capitclize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : "";
    });
};
const toHandlerKey = (str) => {
    return str ? "on" + capitclize(str) : "";
};
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);

function emit(instance, event, ...args) {
    const { props } = instance;
    //tpp
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

class ReactiveEffect {
    constructor(fn, scheduler) {
        this.scheduler = scheduler;
        this.deps = [];
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        if (!this.active) {
            return this._fn();
        }
        shouldTrack = true;
        activeEffect = this;
        const result = this._fn();
        //reset 
        shouldTrack = false;
        return result;
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
let activeEffect;
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn);
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
const targetMap = new Map();
function track(target, key) {
    if (!isTracking())
        return;
    //target -> key -> dep
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
let shouldTrack = false;
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}

function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === "_v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "_v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        //触发依赖
        trigger(target, key);
        return res;
    };
}
const get = createGetter();
const set = createSetter();
const mutableHandlers = {
    get,
    set
};
const readonlyGet = createGetter(true);
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key:${key} set 失败 因为 ${target} 是 readonly 的`);
        return true;
    }
};
const shallowReadonlyGet = createGetter(true, true);
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}
function createReactiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`target:${target}必须是一个对象`);
    }
    return new Proxy(target, baseHandlers);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: (instance) => instance.vnode.el,
    $slots: (instance) => instance.slots,
    $props: (instance) => instance.props
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        //setupState
        const { setupState, props } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDRE */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const val = children[key];
        slots[key] = normalizeSlotValue(val);
    }
}
function normalizeSlotValue(val) {
    return Array.isArray(val) ? val : [val];
}

class RefImpl {
    constructor(value) {
        this._v_isRef = true;
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
function ref(value) {
    return new RefImpl(value);
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function isRef(ref) {
    return !!ref._v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            //set -> ref .value 
            //set -> unref 
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
}

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        next: null,
        type: vnode.type,
        setupState: {},
        el: null,
        slots: null,
        provides: parent ? parent.provides : {},
        parent: {},
        isMounted: false,
        subTree: null,
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    //ctx
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === 'object') {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (compiler && !Component.render) {
        if (Component.template) {
            Component.render = compiler(Component.template);
        }
    }
    instance.render = Component.render;
}
let currentInstacne = null;
function getCurrentInstance() {
    return currentInstacne;
}
function setCurrentInstance(instance) {
    currentInstacne = instance;
}
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
}

function provide(key, val) {
    //存
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = val;
    }
}
function inject(key, defaultVal) {
    //取
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultVal) {
            if (typeof defaultVal === 'function') {
                return defaultVal();
            }
            return defaultVal;
        }
    }
}

function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProp } = prevVNode;
    const { props: nextProp } = nextVNode;
    for (const key in nextProp) {
        if (nextProp[key] !== prevProp[key]) {
            return true;
        }
    }
    return false;
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                //先vnode
                //component -> vnode
                //所有逻辑操作都会基于vnode做处理
                const vnode = createVNode(rootComponent);
                render(vnode, document.querySelector(rootContainer));
            }
        };
    };
}

const queue = [];
let isFlushPending = false;
const p = Promise.resolve();
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
    function queueFlush() {
        if (isFlushPending)
            return;
        isFlushPending = true;
        nextTick(flushJobs);
    }
    function flushJobs() {
        isFlushPending = false;
        let job;
        while ((job = queue.shift())) {
            job && job();
        }
    }
}
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, instert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = options;
    function render(vnode, container, parentComponent) {
        patch(null, vnode, container, parentComponent);
    }
    function patch(n1, n2, container, parentComponent, anchor) {
        const { type, shapeFlag } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                //处理组件
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            patchElement(n1, n2, container, parentComponent);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const { prevShapeFlag, children1 } = n1;
        const { shapeFlag, children2 } = n2;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            if (prevShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                //把老的children清空
                unmountChildren(n1.children);
            }
            //设置text
            if (children1 !== children2) {
                hostSetElementText(container, children2);
            }
        }
        else {
            //new array
            if (prevShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                hostSetElementText(container, "");
                mountChildren(children2, container, parentComponent);
            }
            else {
                patchKeyedChildren(children1, children2, container, parentComponent);
            }
        }
    }
    function patchKeyedChildren(children1, children2, container, parentComponent, anchor) {
        let i = 0;
        let e1 = children1.length - 1, e2 = children2.length - 1;
        function isSomeVNodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key;
        }
        //左侧
        while (i <= e1 && i <= e2) {
            const n1 = children1[i], n2 = children2[i];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent);
            }
            else {
                break;
            }
            i++;
        }
        //右侧
        while (i <= e1 && i <= e2) {
            const n1 = children1[i], n2 = children2[i];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        //新的比旧的多，创建
        if (i > e1) {
            if (i <= e2) {
                e2 + 1 < children2.length ? children2[e2 + 1].el : null;
                while (i <= e2) {
                    patch(null, children2[i], container, parentComponent);
                    i++;
                }
            }
        } //老的比新的多，删除 
        else if (i > e2) {
            while (i <= e1) {
                hostRemove(children1[i].el);
                i++;
            }
        } //节点移动（中间对比）
        else {
            let s1 = i, s2 = i;
            const toBePatched = e2 - s2 + 1;
            let patched = 0;
            const keyToNewIndexMap = new Map();
            const newIndexToOldIndexMap = new Array(toBePatched);
            let moved = false, maxNewIndexSofar = 0;
            for (let i = 0; i < toBePatched; i++)
                newIndexToOldIndexMap[i] = 0;
            for (let i = s2; i <= e2; i++) {
                const nextChild = children2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            for (let i = s1; i <= e1; i++) {
                const prevChild = children1[i];
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex;
                if (prevChild !== null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    for (let j = s2; j <= e2; j++) {
                        if (isSomeVNodeType(prevChild, children2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSofar) {
                        maxNewIndexSofar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(prevChild, children2[newIndex], container, parentComponent);
                    patched++;
                }
            }
            const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = children2[nextIndex];
                const anchor = nextIndex + 1 < children2.length ? children2[nextIndex + 1].el : null;
                //创建节点
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent);
                }
                else if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            children[i];
            hostRemove(children);
        }
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        const el = (vnode.el = hostCreateElement(vnode.type));
        if (vnode.shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = vnode.children;
        }
        else if (vnode.shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(vnode.children, el, parentComponent);
        }
        for (const key in vnode.props) {
            el.setAttribute(key, vnode.props[key]);
        }
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, null, val);
        }
        hostInsert(el, container);
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountComponent(n2, container, parentComponent);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        const { instance } = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        for (const val of children) {
            patch(null, val, container, parentComponent);
        }
    }
    function setupRenderEffect(instance, initialvnode, container, anchor) {
        instance.update = effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                //vnode -> patch
                //vnode -> element -> mount
                patch(null, subTree, container, instance);
                initialvnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                //update
                const { proxy, next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const subTree = instance.render.call(proxy, proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance);
            }
        }, {
            scheduler() {
                queueJobs(instance.update);
            }
        });
    }
    function updateComponentPreRender(instance, nextVNode) {
        instance.vnode = nextVNode;
        instance.next = null;
        instance.props = nextVNode.props;
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    return {
        createApp: createAppAPI(render)
    };
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(child, parent, anchor) {
    parent.insertBefore(child, anchor || null);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText
});
function createApp(rootComponent) {
    return renderer.createApp(rootComponent);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    createElementVNode: createVNode,
    createRenderer: createRenderer,
    createTextVNode: createTextVNode,
    getCurrentInstance: getCurrentInstance,
    h: h,
    inject: inject,
    nextTick: nextTick,
    provide: provide,
    proxyRefs: proxyRefs,
    reactive: reactive,
    ref: ref,
    registerRuntimeCompiler: registerRuntimeCompiler,
    renderSlots: renderSlots,
    toDisplayString: toDisplayString
});

const TO_DISPLAY_STRING = Symbol(`toDisplayString`);
const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");
const helperNameMap = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_VNODE]: "createElementVNode"
};

function generate(ast, options = {}) {
    // 先生成 context
    const context = createCodegenContext(ast, options);
    const { push, mode } = context;
    // 1. 先生成 preambleContext
    if (mode === "module") {
        genModulePreamble(ast, context);
    }
    else {
        genFunctionPreamble(ast, context);
    }
    const functionName = "render";
    const args = ["_ctx"];
    // _ctx,aaa,bbb,ccc
    // 需要把 args 处理成 上面的 string
    const signature = args.join(", ");
    push(`function ${functionName}(${signature}) {`);
    // 这里需要生成具体的代码内容
    // 开始生成 vnode tree 的表达式
    push("return ");
    genNode(ast.codegenNode, context);
    push("}");
    return {
        code: context.code,
    };
}
function genFunctionPreamble(ast, context) {
    const { runtimeGlobalName, push, newline } = context;
    const VueBinging = runtimeGlobalName;
    const aliasHelper = (s) => `${helperNameMap[s]} : _${helperNameMap[s]}`;
    if (ast.helpers.length > 0) {
        push(`
        const { ${ast.helpers.map(aliasHelper).join(", ")}} = ${VueBinging} 

      `);
    }
    newline();
    push(`return `);
}
function genNode(node, context) {
    // 生成代码的规则就是读取 node ，然后基于不同的 node 来生成对应的代码块
    // 然后就是把代码快给拼接到一起就可以了
    switch (node.type) {
        case 2 /* NodeTypes.INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 3 /* NodeTypes.SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 4 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
        case 0 /* NodeTypes.TEXT */:
            genText(node, context);
            break;
    }
}
function genCompoundExpression(node, context) {
    const { push } = context;
    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}
function genText(node, context) {
    // Implement
    const { push } = context;
    push(`'${node.content}'`);
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, props, children } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    genNodeList(genNullableArgs([tag, props, children]), context);
    push(`)`);
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(`${node}`);
        }
        else {
            genNode(node, context);
        }
        // node 和 node 之间需要加上 逗号(,)
        // 但是最后一个不需要 "div", [props], [children]
        if (i < nodes.length - 1) {
            push(", ");
        }
    }
}
function genNullableArgs(args) {
    // 把末尾为null 的都删除掉
    // vue3源码中，后面可能会包含 patchFlag、dynamicProps 等编译优化的信息
    // 而这些信息有可能是不存在的，所以在这边的时候需要删除掉
    let i = args.length;
    // 这里 i-- 用的还是特别的巧妙的
    // 当为0 的时候自然就退出循环了
    while (i--) {
        if (args[i] != null)
            break;
    }
    // 把为 falsy 的值都替换成 "null"
    return args.slice(0, i + 1).map((arg) => arg || "null");
}
function genExpression(node, context) {
    context.push(node.content, node);
}
function genInterpolation(node, context) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(")");
}
function genModulePreamble(ast, context) {
    // preamble 就是 import 语句
    const { push, newline, runtimeModuleName } = context;
    if (ast.helpers.length) {
        // 比如 ast.helpers 里面有个 [toDisplayString]
        // 那么生成之后就是 import { toDisplayString as _toDisplayString } from "vue"
        const code = `import {${ast.helpers
            .map((s) => `${helperNameMap[s]} as _${helperNameMap[s]}`)
            .join(", ")} } from ${JSON.stringify(runtimeModuleName)}`;
        push(code);
    }
    newline();
    push(`export `);
}
function createCodegenContext(ast, { runtimeModuleName = "vue", runtimeGlobalName = "Vue", mode = "function" }) {
    const context = {
        code: "",
        mode,
        runtimeModuleName,
        runtimeGlobalName,
        helper(key) {
            return `_${helperNameMap[key]}`;
        },
        push(code) {
            context.code += code;
        },
        newline() {
            // 换新行
            // TODO 需要额外处理缩进
            context.code += "\n";
        },
    };
    return context;
}

function baseParse(content) {
    const context = createParserContext(content);
    return createRoot(parseChildren(context, []));
}
function createParserContext(content) {
    console.log("创建 paserContext");
    return {
        source: content,
    };
}
function parseChildren(context, ancestors) {
    console.log("开始解析 children");
    const nodes = [];
    while (!isEnd(context, ancestors)) {
        let node;
        const s = context.source;
        if (startsWith(s, "{{")) {
            // 看看如果是 {{ 开头的话，那么就是一个插值， 那么去解析他
            node = parseInterpolation(context);
        }
        else if (s[0] === "<") {
            if (s[1] === "/") {
                // 这里属于 edge case 可以不用关心
                // 处理结束标签
                if (/[a-z]/i.test(s[2])) {
                    // 匹配 </div>
                    // 需要改变 context.source 的值 -> 也就是需要移动光标
                    parseTag(context, 1 /* TagType.End */);
                    // 结束标签就以为这都已经处理完了，所以就可以跳出本次循环了
                    continue;
                }
            }
            else if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors);
            }
        }
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function isEnd(context, ancestors) {
    // 检测标签的节点
    // 如果是结束标签的话，需要看看之前有没有开始标签，如果有的话，那么也应该结束
    // 这里的一个 edge case 是 <div><span></div>
    // 像这种情况下，其实就应该报错
    const s = context.source;
    if (context.source.startsWith("</")) {
        // 从后面往前面查
        // 因为便签如果存在的话 应该是 ancestors 最后一个元素
        for (let i = ancestors.length - 1; i >= 0; --i) {
            if (startsWithEndTagOpen(s, ancestors[i].tag)) {
                return true;
            }
        }
    }
    // 看看 context.source 还有没有值
    return !context.source;
}
function parseElement(context, ancestors) {
    // 应该如何解析 tag 呢
    // <div></div>
    // 先解析开始 tag
    const element = parseTag(context, 0 /* TagType.Start */);
    ancestors.push(element);
    const children = parseChildren(context, ancestors);
    ancestors.pop();
    // 解析 end tag 是为了检测语法是不是正确的
    // 检测是不是和 start tag 一致
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1 /* TagType.End */);
    }
    else {
        throw new Error(`缺失结束标签：${element.tag}`);
    }
    element.children = children;
    return element;
}
function startsWithEndTagOpen(source, tag) {
    // 1. 头部 是不是以  </ 开头的
    // 2. 看看是不是和 tag 一样
    return (startsWith(source, "</") &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase());
}
function parseTag(context, type) {
    // 发现如果不是 > 的话，那么就把字符都收集起来 ->div
    // 正则
    const match = /^<\/?([a-z][^\r\n\t\f />]*)/i.exec(context.source);
    const tag = match[1];
    // 移动光标
    // <div
    advanceBy(context, match[0].length);
    // 暂时不处理 selfClose 标签的情况 ，所以可以直接 advanceBy 1个坐标 <  的下一个就是 >
    advanceBy(context, 1);
    if (type === 1 /* TagType.End */)
        return;
    let tagType = 0 /* ElementTypes.ELEMENT */;
    return {
        type: 4 /* NodeTypes.ELEMENT */,
        tag,
        tagType,
    };
}
function parseInterpolation(context) {
    // 1. 先获取到结束的index
    // 2. 通过 closeIndex - startIndex 获取到内容的长度 contextLength
    // 3. 通过 slice 截取内容
    // }} 是插值的关闭
    // 优化点是从 {{ 后面搜索即可
    const openDelimiter = "{{";
    const closeDelimiter = "}}";
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    // TODO closeIndex -1 需要报错的
    // 让代码前进2个长度，可以把 {{ 干掉
    advanceBy(context, 2);
    const rawContentLength = closeIndex - openDelimiter.length;
    const rawContent = context.source.slice(0, rawContentLength);
    const preTrimContent = parseTextData(context, rawContent.length);
    const content = preTrimContent.trim();
    // 最后在让代码前进2个长度，可以把 }} 干掉
    advanceBy(context, closeDelimiter.length);
    return {
        type: 2 /* NodeTypes.INTERPOLATION */,
        content: {
            type: 3 /* NodeTypes.SIMPLE_EXPRESSION */,
            content,
        },
    };
}
function parseText(context) {
    console.log("解析 text", context);
    // endIndex 应该看看有没有对应的 <
    // 比如 hello</div>
    // 像这种情况下 endIndex 就应该是在 o 这里
    // {
    const endTokens = ["<", "{{"];
    let endIndex = context.source.length;
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i]);
        // endIndex > index 是需要要 endIndex 尽可能的小
        // 比如说：
        // hi, {{123}} <div></div>
        // 那么这里就应该停到 {{ 这里，而不是停到 <div 这里
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    const content = parseTextData(context, endIndex);
    return {
        type: 0 /* NodeTypes.TEXT */,
        content,
    };
}
function parseTextData(context, length) {
    console.log("解析 textData");
    // 1. 直接返回 context.source
    // 从 length 切的话，是为了可以获取到 text 的值（需要用一个范围来确定）
    const rawText = context.source.slice(0, length);
    // 2. 移动光标
    advanceBy(context, length);
    return rawText;
}
function advanceBy(context, numberOfCharacters) {
    console.log("推进代码", context, numberOfCharacters);
    context.source = context.source.slice(numberOfCharacters);
}
function createRoot(children) {
    return {
        type: 1 /* NodeTypes.ROOT */,
        children,
        helpers: [],
    };
}
function startsWith(source, searchString) {
    return source.startsWith(searchString);
}

function transform(root, options = {}) {
    // 1. 创建 context
    const context = createTransformContext(root, options);
    // 2. 遍历 node
    traverseNode(root, context);
    createRootCodegen(root);
    root.helpers.push(...context.helpers.keys());
}
function traverseNode(node, context) {
    const type = node.type;
    // 遍历调用所有的 nodeTransforms
    // 把 node 给到 transform
    // 用户可以对 node 做处理
    const nodeTransforms = context.nodeTransforms;
    const exitFns = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        const onExit = transform(node, context);
        if (onExit) {
            exitFns.push(onExit);
        }
    }
    switch (type) {
        case 2 /* NodeTypes.INTERPOLATION */:
            // 插值的点，在于后续生成 render 代码的时候是获取变量的值
            context.helper(TO_DISPLAY_STRING);
            break;
        case 1 /* NodeTypes.ROOT */:
        case 4 /* NodeTypes.ELEMENT */:
            traverseChildren(node, context);
            break;
    }
    let i = exitFns.length;
    // i-- 这个很巧妙
    // 使用 while 是要比 for 快 (可以使用 https://jsbench.me/ 来测试一下)
    while (i--) {
        exitFns[i]();
    }
}
function traverseChildren(parent, context) {
    // node.children
    parent.children.forEach((node) => {
        // TODO 需要设置 context 的值
        traverseNode(node, context);
    });
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(name) {
            // 这里会收集调用的次数
            // 收集次数是为了给删除做处理的， （当只有 count 为0 的时候才需要真的删除掉）
            // helpers 数据会在后续生成代码的时候用到
            const count = context.helpers.get(name) || 0;
            context.helpers.set(name, count + 1);
        },
    };
    return context;
}
function createRootCodegen(root, context) {
    const { children } = root;
    // 只支持有一个根节点
    // 并且还是一个 single text node
    const child = children[0];
    // 如果是 element 类型的话 ， 那么我们需要把它的 codegenNode 赋值给 root
    // root 其实是个空的什么数据都没有的节点
    // 所以这里需要额外的处理 codegenNode
    // codegenNode 的目的是专门为了 codegen 准备的  为的就是和 ast 的 node 分离开
    if (child.type === 4 /* NodeTypes.ELEMENT */ && child.codegenNode) {
        const codegenNode = child.codegenNode;
        root.codegenNode = codegenNode;
    }
    else {
        root.codegenNode = child;
    }
}

function transformExpression(node) {
    if (node.type === 2 /* NodeTypes.INTERPOLATION */) {
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function createVNodeCall(context, tag, props, children) {
    if (context) {
        context.helper(CREATE_ELEMENT_VNODE);
    }
    return {
        // TODO vue3 里面这里的 type 是 VNODE_CALL
        // 是为了 block 而 mini-vue 里面没有实现 block 
        // 所以创建的是 Element 类型就够用了
        type: 4 /* NodeTypes.ELEMENT */,
        tag,
        props,
        children,
    };
}

function transformElement(node, context) {
    if (node.type === 4 /* NodeTypes.ELEMENT */) {
        return () => {
            // 没有实现 block  所以这里直接创建 element
            // TODO
            // 需要把之前的 props 和 children 等一系列的数据都处理
            const vnodeTag = `'${node.tag}'`;
            // TODO props 暂时不支持
            const vnodeProps = null;
            let vnodeChildren = null;
            if (node.children.length > 0) {
                if (node.children.length === 1) {
                    // 只有一个孩子节点 ，那么当生成 render 函数的时候就不用 [] 包裹
                    const child = node.children[0];
                    vnodeChildren = child;
                }
            }
            // 创建一个新的 node 用于 codegen 的时候使用
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

function isText(node) {
    return node.type === 2 /* NodeTypes.INTERPOLATION */ || node.type === 0 /* NodeTypes.TEXT */;
}

function transformText(node, context) {
    if (node.type === 4 /* NodeTypes.ELEMENT */) {
        // 在 exit 的时期执行
        // 下面的逻辑会改变 ast 树
        // 有些逻辑是需要在改变之前做处理的
        return () => {
            // hi,{{msg}}
            // 上面的模块会生成2个节点，一个是 text 一个是 interpolation 的话
            // 生成的 render 函数应该为 "hi," + _toDisplayString(_ctx.msg)
            // 这里面就会涉及到添加一个 “+” 操作符
            // 那这里的逻辑就是处理它
            // 检测下一个节点是不是 text 类型，如果是的话， 那么会创建一个 COMPOUND 类型
            // COMPOUND 类型把 2个 text || interpolation 包裹（相当于是父级容器）
            const children = node.children;
            let currentContainer;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    // 看看下一个节点是不是 text 类
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            // currentContainer 的目的是把相邻的节点都放到一个 容器内
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                                    loc: child.loc,
                                    children: [child],
                                };
                            }
                            currentContainer.children.push(` + `, next);
                            // 把当前的节点放到容器内, 然后删除掉j
                            children.splice(j, 1);
                            // 因为把 j 删除了，所以这里就少了一个元素，那么 j 需要 --
                            j--;
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

function baseCompile(template, options) {
    // 1. 先把 template 也就是字符串 parse 成 ast
    const ast = baseParse(template);
    // 2. 给 ast 加点料（- -#）
    transform(ast, Object.assign(options, {
        nodeTransforms: [transformElement, transformText, transformExpression],
    }));
    // 3. 生成 render 函数代码
    return generate(ast);
}

// 这个文件充当 vue 模块
function compileToFunction(template, options = {}) {
    const { code } = baseCompile(template, options);
    // 调用 compile 得到的代码在给封装到函数内，
    // 这里会依赖 runtimeDom 的一些函数，所以在这里通过参数的形式注入进去
    const render = new Function("Vue", code)(runtimeDom);
    return render;
}
registerRuntimeCompiler(compileToFunction);

export { createApp, createVNode as createElementVNode, createRenderer, createTextVNode, getCurrentInstance, h, inject, nextTick, provide, proxyRefs, reactive, ref, registerRuntimeCompiler, renderSlots, toDisplayString };
