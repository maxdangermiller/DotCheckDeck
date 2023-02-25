const getApi = () => {
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        return window.location.protocol + "//" + window.location.hostname + ":5000";
    } else {
        return "https://dcd-api.azurewebsites.net/";
    }
    
}

export default getApi;