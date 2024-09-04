const asyncHandler = (requestHandler)=>{
    (req,res,next) =>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=> next(err))
    }
}




export { asyncHandler };















//asynchandler higher order function ho jasma chai function lai nai as a parameter accept garxa ra return garxa IIFE immediately invoke garxa function lai
// this is how it works 
// const asyncHandler = ()=>{}
// const asyncHandler = (func)=> async ()=>{}

//wrapper function ho yo chai try catch wala ho yo chai 
// const asyncHandler = (fun) => async(req,res,next) => {
//     try {
//         await fun(req,res,next);
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success:false,
//             message: error.message,
//         });
//     }

// } 
