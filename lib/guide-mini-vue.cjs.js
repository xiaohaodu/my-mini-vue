'use strict';

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children
    };
    return vnode;
}

const isObject = (val) => {
    return val !== null && typeof val == 'object';
};

const publicPropertiesMap = {
    $el: (instance) => instance.vnode.el
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        //setupState
        if (key in instance.setupState) {
            return instance.setupState[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        el: null
    };
    return component;
}
function setupComponent(instance) {
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    //ctx
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        const setupResult = setup();
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    instance.render = Component.render;
}

function render(vnode, container) {
    //
    patch(vnode, container);
}
function patch(vnode, container) {
    //处理组件
    if (typeof vnode.type === 'string') {
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const el = (vnode.el = document.createElement(vnode.type));
    if (typeof vnode.children === "string") {
        el.textContent = vnode.children;
    }
    else if (Array.isArray(vnode.children)) {
        for (const val of vnode.children) {
            patch(val, el);
        }
    }
    for (const key in vnode.props) {
        el.setAttribute(key, vnode.props[key]);
    }
    container.append(el);
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(initialvnode, container) {
    const instance = createComponentInstance(initialvnode);
    setupComponent(instance);
    setupRenderEffect(instance, initialvnode, container);
}
function setupRenderEffect(instance, initialvnode, container) {
    const subTree = instance.render.call(instance.proxy);
    //vnode -> patch
    //vnode -> element -> mount
    patch(subTree, container);
    initialvnode.el = subTree.el;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            //先vnode
            //component -> vnode
            //所有逻辑操作都会基于vnode做处理
            const vnode = createVNode(rootComponent);
            render(vnode, document.querySelector(rootContainer));
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
