import { h, renderSlots } from "../../lib/guide-mini-vue.esm.js";
export const Foo = {
    setup(props, { emit }) {
        const emitAdd = () => {
            console.log('emit');
            emit('add');
            return;
        };
        return { emitAdd };
    },
    render() {
        const btn = h('button', {
            onclick: this.emitAdd
        }, 'emitAdd');
        const foo = h('p', {}, 'foo');
        return h('div', {}, [foo, btn]);
    },
};