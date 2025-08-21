const getApi = () => {
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        return "http://localhost:5000";
    } else {
        return "https://dcd-api.azurewebsites.net";
    }
    
}

export default getApi;