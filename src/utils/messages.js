const generateMessage = (msg,username)=>{
    return {
        "text" : msg,
        username,
        "createdAt"  : new Date().getTime()
    }
}

module.exports={
    generateMessage
}