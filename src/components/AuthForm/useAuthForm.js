import {useState} from "react";

export default function useAuthForm(initialValues, validateFn, onSubmit) {
    const [formData, setFormData] = useState(initialValues);
    const [errors, setErrors] = useState({});   
    const [isLoading, setIsLoading] = useState(false);
    
    //handle change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });   
        setErrors({ ...errors, [name]: ""});

    };

    //handle submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validateFn(formData);
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        
        setIsLoading(true);
        try {
            await onSubmit(formData)
        } finally {
            setIsLoading(false);    
        }
    }

    return {
        formData,
        errors,
        isLoading,
        handleChange,
        handleSubmit
    }
} 