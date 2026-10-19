import { useState } from "react"
import instance from "../axios/axiosInstance"

export const useHttp = () => {
    const [ isLoading, setIsLoading ] = useState(false)
    const [ error, setError ] = useState(null)
    const [ data, setData ] = useState(null)

    const sendRequest = async (url, method, data, config) => {
        try{
            setIsLoading(true)
            const result = await instance({
                url,
                method,
                data, 
                ...config
            })
            setData(result.data)
            return result.data
        }catch(err){
            setError(err.message)
            throw err
        }finally{
            setIsLoading(false)
        }
    }

    return { isLoading, error, data, sendRequest }
}