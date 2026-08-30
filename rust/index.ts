
function promisify(ms:number){

return new Promise((res ,)=>{
    setTimeout(() => {
        res("hi there");
    }, ms);
})
}


(await promisify(3000))()