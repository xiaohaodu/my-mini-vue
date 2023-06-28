import { NodeTypes } from "./ast";

export function baseParse(content: string) {
    const context = createParseContext(content);
    return createRoot(parseChildren(context));
}
function parseChildren(context) {
    const nodes: any = [];
    let node;
    if (context.source.startsWith("{{")) {
        node = parseInterpolation(context);
    }
    nodes.push(node);
    return nodes;
}
function parseInterpolation(context) {
    const openDelimiter = "{{", closeDelimiter = "}}";
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    advanceBy(context, openDelimiter.length);
    const rawContentLength = closeIndex - openDelimiter.length;
    const rawContent = context.source.slice(0, rawContentLength);
    const content = rawContent.trim();
    advanceBy(context, rawContentLength + openDelimiter.length);
    return {
        type: NodeTypes.INTERPOLATION,
        content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: content
        }
    };
}
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
function createParseContext(content) {
    return {
        source: content
    };
}
function createRoot(children) {
    return {
        children
    };
}
