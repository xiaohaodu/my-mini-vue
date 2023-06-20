import { effect } from "../reactivity/effect";
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
        patch(null, vnode, container, parentComponent);
    };
    function patch(n1, n2, container, parentComponent) {
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
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, parentComponent);
                } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parentComponent) {
        mountChildren(n2, container, parentComponent);
    };
    function processElement(n1, n2, container, parentComponent) {
        if (!n1) {
            mountElement(n2, container, parentComponent);
        } else {
            patchElement(n1, n2, container);
        }
    }
    function patchElement(n1, n2, container) {

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
    function processComponent(n1, n2, container, parentComponent) {
        mountComponent(n2, container, parentComponent);
    }
    function mountComponent(initialvnode, container, parentComponent) {
        const instance = createComponentInstance(initialvnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialvnode, container);
    }
    function mountChildren(vnode, container, parentComponent) {
        for (const val of vnode.children) {
            patch(null, val, container, parentComponent);
        }
    }
    function setupRenderEffect(instance, initialvnode, container) {
        effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy));
                //vnode -> patch
                //vnode -> element -> mount
                patch(null, subTree, container, instance);
                initialvnode.el = subTree.el;
                instance.isMounted = true;
            } else {
                //update
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance);
            }
        });
    }

    function processText(n1, n2: any, container: any) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    return {
        createApp: createAppAPI(render)
    };
}