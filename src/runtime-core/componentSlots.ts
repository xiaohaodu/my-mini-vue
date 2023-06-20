import { ShapeFlags } from "../shared/ShapeFlags";

export function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDRE) {
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