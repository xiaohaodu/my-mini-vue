const publicPropertiesMap = {
    $el: (instance) => instance.vnode.el
};
export const PublicInstanceProxyHandlers = {
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