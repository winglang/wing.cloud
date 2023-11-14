"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = exports.Fly = void 0;
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
/**
 * Fly.io apps managment.
 */
class Fly {
    constructor(client) {
        this.client = client;
    }
    app(name) {
        return new App({ name, client: this.client });
    }
    async listApps() {
        const res = await this.client.apps();
        const apps = [];
        for (let app of res.data.apps.nodes) {
            apps.push(new App({ client: this.client, name: app.id }));
        }
        return apps;
    }
}
exports.Fly = Fly;
_a = JSII_RTTI_SYMBOL_1;
Fly[_a] = { fqn: "@wingcloud/flyio.Fly", version: "0.0.0" };
/**
 * Represent a Fly.io app
 */
class App {
    constructor(props) {
        this.props = props;
    }
    /**
     * Get the hostname of this app (e.g. app-name.fly.dev).
     */
    hostname() {
        return `${this.props.name}.fly.dev`;
    }
    /**
     * Get the public url of this app (e.g. https://app-name.fly.dev).
     */
    url() {
        return `https://${this.hostname()}`;
    }
    /**
     * Get the app creation date.
     */
    async createdAt() {
        const res = await this.props.client.getApp(this.props.name);
        return new Date(res.data.app.createdAt);
    }
    /**
     * App is ready when all of its machines are in `started` state.
     */
    async isReady() {
        const res = await this.props.client.getApp(this.props.name);
        return res.data.app.machines.nodes.every((n) => n.state === "started");
    }
    /**
     * Get id and state for the machines of this app
     */
    async machinesInfo() {
        const res = await this.props.client.getApp(this.props.name);
        return res.data.app.machines.nodes;
    }
    /**
     * Create a new Fly.io app for this instance.
     */
    async create() {
        await this.props.client.createApp(this.props.name);
        await this.props.client.allocateIpAddress(this.props.name);
    }
    /**
     * Delete this Fly.io app.
     */
    async destroy() {
        return this.props.client.deleteApp(this.props.name);
    }
    /**
     * Create a new machine for this app.
     * By default this will wait for the machine to start.
     * @param [wait=true] wait for the the machine to reach status `started`.
     */
    async addMachine(props, wait = true) {
        const createMachineResult = await this.props.client.createMachine({
            appName: this.props.name,
            imageName: props.imageName,
            port: props.port,
            region: props.region,
            memoryMb: props.memoryMb,
            env: props.env,
        });
        if (wait) {
            await this.props.client.waitForMachineState(this.props.name, createMachineResult);
        }
        return createMachineResult;
    }
    /**
     * Remove a machine from this app.
     */
    async removeMachine(machineId) {
        return this.props.client.deleteMachine(this.props.name, machineId);
    }
    /**
     * Update all machines of this app with the given props
     * @param props the props of the new machines
     * @returns machine creation result
     */
    async update(props) {
        const info = await this.machinesInfo();
        for (let machine of info) {
            await this.removeMachine(machine.id);
        }
        const result = [];
        for (let i = 0; i < info.length; i++) {
            result.push(await this.addMachine(props));
        }
        return result;
    }
}
exports.App = App;
_b = JSII_RTTI_SYMBOL_1;
App[_b] = { fqn: "@wingcloud/flyio.App", version: "0.0.0" };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBZUE7O0dBRUc7QUFDSCxNQUFhLEdBQUc7SUFDZCxZQUFvQixNQUFpQjtRQUFqQixXQUFNLEdBQU4sTUFBTSxDQUFXO0lBQUcsQ0FBQztJQUNsQyxHQUFHLENBQUMsSUFBWTtRQUNyQixPQUFPLElBQUksR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUNoRCxDQUFDO0lBRU0sS0FBSyxDQUFDLFFBQVE7UUFDbkIsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3JDLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNoQixLQUFLLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNuQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDM0Q7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7O0FBYkgsa0JBY0M7OztBQUVEOztHQUVHO0FBQ0gsTUFBYSxHQUFHO0lBQ2QsWUFBbUIsS0FBZ0I7UUFBaEIsVUFBSyxHQUFMLEtBQUssQ0FBVztJQUFHLENBQUM7SUFFdkM7O09BRUc7SUFDSSxRQUFRO1FBQ2IsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxVQUFVLENBQUM7SUFDdEMsQ0FBQztJQUVEOztPQUVHO0lBQ0ksR0FBRztRQUNSLE9BQU8sV0FBVyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztJQUN0QyxDQUFDO0lBRUQ7O09BRUc7SUFDSSxLQUFLLENBQUMs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QUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUN0QztRQUVELE1BQU0sTUFBTSxHQUEyQixFQUFFLENBQUM7UUFDMUMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDcEMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztTQUMzQztRQUVELE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7O0FBdkdILGtCQXdHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEZseUNsaWVudCwgSUNyZWF0ZU1hY2hpbmVSZXN1bHQgfSBmcm9tIFwiLi9jbGllbnQuanNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBJQXBwUHJvcHMge1xuICByZWFkb25seSBjbGllbnQ6IEZseUNsaWVudDtcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElDcmVhdGVNYWNoaW5lUHJvcHMge1xuICByZWFkb25seSBpbWFnZU5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgcmVnaW9uPzogc3RyaW5nO1xuICByZWFkb25seSBtZW1vcnlNYj86IG51bWJlcjtcbiAgcmVhZG9ubHkgZW52OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICByZWFkb25seSBwb3J0OiBudW1iZXI7XG59XG5cbi8qKlxuICogRmx5LmlvIGFwcHMgbWFuYWdtZW50LlxuICovXG5leHBvcnQgY2xhc3MgRmx5IHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjbGllbnQ6IEZseUNsaWVudCkge31cbiAgcHVibGljIGFwcChuYW1lOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gbmV3IEFwcCh7IG5hbWUsIGNsaWVudDogdGhpcy5jbGllbnQgfSk7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgbGlzdEFwcHMoKSB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy5jbGllbnQuYXBwcygpO1xuICAgIGNvbnN0IGFwcHMgPSBbXTtcbiAgICBmb3IgKGxldCBhcHAgb2YgcmVzLmRhdGEuYXBwcy5ub2Rlcykge1xuICAgICAgYXBwcy5wdXNoKG5ldyBBcHAoeyBjbGllbnQ6IHRoaXMuY2xpZW50LCBuYW1lOiBhcHAuaWQgfSkpO1xuICAgIH1cbiAgICByZXR1cm4gYXBwcztcbiAgfVxufVxuXG4vKipcbiAqIFJlcHJlc2VudCBhIEZseS5pbyBhcHBcbiAqL1xuZXhwb3J0IGNsYXNzIEFwcCB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBwcm9wczogSUFwcFByb3BzKSB7fVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGhvc3RuYW1lIG9mIHRoaXMgYXBwIChlLmcuIGFwcC1uYW1lLmZseS5kZXYpLlxuICAgKi9cbiAgcHVibGljIGhvc3RuYW1lKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3RoaXMucHJvcHMubmFtZX0uZmx5LmRldmA7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBwdWJsaWMgdXJsIG9mIHRoaXMgYXBwIChlLmcuIGh0dHBzOi8vYXBwLW5hbWUuZmx5LmRldikuXG4gICAqL1xuICBwdWJsaWMgdXJsKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBodHRwczovLyR7dGhpcy5ob3N0bmFtZSgpfWA7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBhcHAgY3JlYXRpb24gZGF0ZS5cbiAgICovXG4gIHB1YmxpYyBhc3luYyBjcmVhdGVkQXQoKSB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy5wcm9wcy5jbGllbnQuZ2V0QXBwKHRoaXMucHJvcHMubmFtZSk7XG4gICAgcmV0dXJuIG5ldyBEYXRlKHJlcy5kYXRhLmFwcC5jcmVhdGVkQXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcCBpcyByZWFkeSB3aGVuIGFsbCBvZiBpdHMgbWFjaGluZXMgYXJlIGluIGBzdGFydGVkYCBzdGF0ZS5cbiAgICovXG4gIHB1YmxpYyBhc3luYyBpc1JlYWR5KCkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMucHJvcHMuY2xpZW50LmdldEFwcCh0aGlzLnByb3BzLm5hbWUpO1xuICAgIHJldHVybiByZXMuZGF0YS5hcHAubWFjaGluZXMubm9kZXMuZXZlcnkoKG4pID0+IG4uc3RhdGUgPT09IFwic3RhcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgaWQgYW5kIHN0YXRlIGZvciB0aGUgbWFjaGluZXMgb2YgdGhpcyBhcHBcbiAgICovXG4gIHB1YmxpYyBhc3luYyBtYWNoaW5lc0luZm8oKSB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy5wcm9wcy5jbGllbnQuZ2V0QXBwKHRoaXMucHJvcHMubmFtZSk7XG4gICAgcmV0dXJuIHJlcy5kYXRhLmFwcC5tYWNoaW5lcy5ub2RlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgRmx5LmlvIGFwcCBmb3IgdGhpcyBpbnN0YW5jZS5cbiAgICovXG4gIHB1YmxpYyBhc3luYyBjcmVhdGUoKSB7XG4gICAgYXdhaXQgdGhpcy5wcm9wcy5jbGllbnQuY3JlYXRlQXBwKHRoaXMucHJvcHMubmFtZSk7XG4gICAgYXdhaXQgdGhpcy5wcm9wcy5jbGllbnQuYWxsb2NhdGVJcEFkZHJlc3ModGhpcy5wcm9wcy5uYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgdGhpcyBGbHkuaW8gYXBwLlxuICAgKi9cbiAgcHVibGljIGFzeW5jIGRlc3Ryb3koKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMuY2xpZW50LmRlbGV0ZUFwcCh0aGlzLnByb3BzLm5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBtYWNoaW5lIGZvciB0aGlzIGFwcC5cbiAgICogQnkgZGVmYXVsdCB0aGlzIHdpbGwgd2FpdCBmb3IgdGhlIG1hY2hpbmUgdG8gc3RhcnQuXG4gICAqIEBwYXJhbSBbd2FpdD10cnVlXSB3YWl0IGZvciB0aGUgdGhlIG1hY2hpbmUgdG8gcmVhY2ggc3RhdHVzIGBzdGFydGVkYC5cbiAgICovXG4gIHB1YmxpYyBhc3luYyBhZGRNYWNoaW5lKHByb3BzOiBJQ3JlYXRlTWFjaGluZVByb3BzLCB3YWl0OiBib29sZWFuID0gdHJ1ZSkge1xuICAgIGNvbnN0IGNyZWF0ZU1hY2hpbmVSZXN1bHQgPSBhd2FpdCB0aGlzLnByb3BzLmNsaWVudC5jcmVhdGVNYWNoaW5lKHtcbiAgICAgIGFwcE5hbWU6IHRoaXMucHJvcHMubmFtZSxcbiAgICAgIGltYWdlTmFtZTogcHJvcHMuaW1hZ2VOYW1lLFxuICAgICAgcG9ydDogcHJvcHMucG9ydCxcbiAgICAgIHJlZ2lvbjogcHJvcHMucmVnaW9uLFxuICAgICAgbWVtb3J5TWI6IHByb3BzLm1lbW9yeU1iLFxuICAgICAgZW52OiBwcm9wcy5lbnYsXG4gICAgfSk7XG4gICAgaWYgKHdhaXQpIHtcbiAgICAgIGF3YWl0IHRoaXMucHJvcHMuY2xpZW50LndhaXRGb3JNYWNoaW5lU3RhdGUoXG4gICAgICAgIHRoaXMucHJvcHMubmFtZSxcbiAgICAgICAgY3JlYXRlTWFjaGluZVJlc3VsdCxcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBjcmVhdGVNYWNoaW5lUmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhIG1hY2hpbmUgZnJvbSB0aGlzIGFwcC5cbiAgICovXG4gIHB1YmxpYyBhc3luYyByZW1vdmVNYWNoaW5lKG1hY2hpbmVJZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMuY2xpZW50LmRlbGV0ZU1hY2hpbmUodGhpcy5wcm9wcy5uYW1lLCBtYWNoaW5lSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBhbGwgbWFjaGluZXMgb2YgdGhpcyBhcHAgd2l0aCB0aGUgZ2l2ZW4gcHJvcHNcbiAgICogQHBhcmFtIHByb3BzIHRoZSBwcm9wcyBvZiB0aGUgbmV3IG1hY2hpbmVzXG4gICAqIEByZXR1cm5zIG1hY2hpbmUgY3JlYXRpb24gcmVzdWx0XG4gICAqL1xuICBwdWJsaWMgYXN5bmMgdXBkYXRlKHByb3BzOiBJQ3JlYXRlTWFjaGluZVByb3BzKSB7XG4gICAgY29uc3QgaW5mbyA9IGF3YWl0IHRoaXMubWFjaGluZXNJbmZvKCk7XG4gICAgZm9yIChsZXQgbWFjaGluZSBvZiBpbmZvKSB7XG4gICAgICBhd2FpdCB0aGlzLnJlbW92ZU1hY2hpbmUobWFjaGluZS5pZCk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0OiBJQ3JlYXRlTWFjaGluZVJlc3VsdFtdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbmZvLmxlbmd0aDsgaSsrKSB7XG4gICAgICByZXN1bHQucHVzaChhd2FpdCB0aGlzLmFkZE1hY2hpbmUocHJvcHMpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG59XG4iXX0=