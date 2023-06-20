import { ShapeFlags } from "../shared/ShapeFlags";
import { isObject } from "../shared/index";
import { Fragment } from "./VNode";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";

export function createRenderer(options) {
    const {
        hostCreateElement,
        hostPatchProp,
        hostInsert
    } = options;
    function render(vnode, container, parentComponent) {
        patch(vnode, container, parentComponent);
    };
    function patch(vnode, container, parentComponent) {
        const { type, shapeFlag } = vnode;

        switch (type) {
            case Fragment:
                processFragment(vnode, container, parentComponent);
                break;
            case Text:
                processText(vnode, container);
                break;
        }
        //处理组件
        if (shapeFlag & ShapeFlags.ELEMENT) {
            processElement(vnode, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
            processComponent(vnode, container, parentComponent);
        }
    }
    function processFragment(vnode, container, parentComponent) {
        mountChildren(vnode, container, parentComponent);
    };
    function processElement(vnode, container, parentComponent) {
        mountElement(vnode, container, parentComponent);
    }
    function mountElement(vnode, container, parentComponent) {
        const el = (vnode.el = hostCreateElement(vnode.type));
        if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            el.textContent = vnode.children;
        } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(vnode, el, parentComponent);
        }
        for (const key in vnode.props) {
            el.setAttribute(key, vnode.props[key]);
        }
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, val);
        }
        hostInsert(el, container);
    };
    function processComponent(vnode, container, parentComponent) {
        mountComponent(vnode, container, parentComponent);
    }
    function mountComponent(initialvnode, container, parentComponent) {
        const instance = createComponentInstance(initialvnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialvnode, container);
    }
    function mountChildren(vnode, container, parentComponent) {
        for (const val of vnode.children) {
            patch(val, container, parentComponent);
        }
    }
    function setupRenderEffect(instance, initialvnode, container) {
        const subTree = instance.render.call(instance.proxy);
        //vnode -> patch
        //vnode -> element -> mount
        patch(subTree, container, instance);
        initialvnode.el = subTree.el;
    }

    function processText(vnode: any, container: any) {
        const { children } = vnode;
        const textNode = (vnode.el = document.createTextNode(children));
        container.append(textNode);
    }
    return {
        createApp: createAppAPI(render)
    };
}