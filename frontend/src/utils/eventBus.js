/**
 * Simple event bus for cross-component communication.
 * Primarily used for triggering global UI elements like Snapbars/Alerts
 * from non-react contexts like Axios interceptors.
 */
const eventBus = {
    on(event, callback) {
        const handler = (e) => callback(e.detail);
        callback._handler = handler; // Store reference for removal
        document.addEventListener(event, handler);
    },
    dispatch(event, data) {
        document.dispatchEvent(new CustomEvent(event, { detail: data }));
    },
    remove(event, callback) {
        if (callback._handler) {
            document.removeEventListener(event, callback._handler);
            delete callback._handler;
        }
    }
};

export default eventBus;
