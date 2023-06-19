import { h } from "../../lib/guide-mini-vue.esm.js";
export const App = {
    render() {
        window.self = this;
        // return h("div", {
        //     id: 'root', class: ['red', 'hard']
        // }, "hi, " + this.msg);
        return h("div", {
            id: "root", class: ['red', 'hard']
        }, [h("p", { class: 'red' }, 'hi '), h("p", { class: 'blue' }, 'mini-vue')]);
    },
    setup(props) {
        return {
            msg: "mini-vue"
        };
    }
};