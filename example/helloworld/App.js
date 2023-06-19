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