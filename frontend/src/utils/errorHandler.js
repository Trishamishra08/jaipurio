export const parseApiError = (error) => {
    let message = 'An unexpected error occurred. Please try again.';

    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        // It checks common structures like error.response.data.message
        message = error.response.data?.message || 
                  error.response.data?.error || 
                  `Error: ${error.response.status} ${error.response.statusText}`;
    } else if (error.request) {
        // The request was made but no response was received (Network error)
        message = 'Network error. Please check your connection or try again later.';
    } else {
        // Something happened in setting up the request that triggered an Error
        message = error.message;
    }

    return message;
};
