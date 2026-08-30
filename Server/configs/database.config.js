import mongoose from 'mongoose' ; 

const dbconnection = async () => {
    await mongoose.connect(`${process.env.BASE_URL}`)
    .then(()=> {
        console.log('Database connection successfully'); 
    })
    .catch(err => {
        console.log("Couldn't Connect To DB " , err) ; 
        process.exit(-1) ; 
    })
}

export default dbconnection ; 