import React from 'react';
import { useLocation } from 'react-router-dom';


function useQuery() {
    const { search } = useLocation();
  
    return React.useMemo(() => new URLSearchParams(search), [search]);
}

const ErrorPage = (props) => {
    let query = useQuery();

    const resetClient = () => {
        localStorage.clear();
        window.location.href = "/login";
    }

    const goBack = () => {
        window.location.href = query.get("return");
    }

    return (
        <div className="d-flex align-items-center justify-content-center vh-100 vw-100">
            <div className="text-center">
                <h1 className="display-1 fw-bold">Error</h1>
                <p className="fs-3"> <span className="text-danger">Oops!</span> We encountered an Error.</p>
                <p className="lead">
                    {query.get("message")}
                </p>
                <a href="#"  className="btn btn-primary" onClick={goBack}>Go Back</a>
                <a href="#" className="btn btn-danger" onClick={resetClient}>Reset Client</a>
            </div>
        </div>
    );
}

export default ErrorPage;