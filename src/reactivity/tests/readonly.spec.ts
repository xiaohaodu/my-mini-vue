import { isProxy, isReadonly, readonly } from "../reactive";
import { vi } from 'vitest';
describe("readonly", () => {
    it("happly path", () => {
        //not set
        const original = { foo: 1, bar: { baz: 2 } };
        const wrapped = readonly(original);
        expect(wrapped).not.toBe(original);
        expect(wrapped.foo).toBe(1);
        expect(isProxy(wrapped)).toBe(true);
    });
    it("should call console.warn when set", () => {
        console.warn = vi.fn();
        const user = readonly({
            age: 10
        });
        user.age = 11;
        expect(console.warn).toBeCalled();
    });
    it("should make nested values readonly", () => {
        const origianl = { foo: 1, bar: { baz: 2 } };
        const wrapped = readonly(origianl);
        expect(wrapped).not.toBe(origianl);
        expect(isReadonly(wrapped)).toBe(true);
        expect(isReadonly(origianl)).toBe(false);
        expect(isReadonly(wrapped.bar)).toBe(true);
        expect(isReadonly(origianl.bar)).toBe(false);
        expect(wrapped.foo).toBe(1);
    });
});