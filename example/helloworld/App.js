import { h } from "../../lib/guide-mini-vue.esm.js";
export const App = {
    render() {
        return h("div", "hi, " + this.msg);
    },
    setup(props) {
        return {
            msg: "mini-vue"
        };
    }
};