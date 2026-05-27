/**
 * Simple event bus for cross-component communication.
 * Primarily used for triggering global UI elements like Snapbars/Alerts
 * from non-react contexts like Axios interceptors.
 */
const eventBus = {
    on(event, callback) {
        document.addEventListener(event, (e) => callback(e.detail));
    },
    dispatch(event, data) {
        document.dispatchEvent(new CustomEvent(event, { detail: data }));
    },
    remove(event, callback) {
        document.removeEventListener(event, callback);
    }
};

export default eventBus;
