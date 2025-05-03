export default async function registerUser(userData, userRepository) {
    if(!userData.email || !userData.password || userData.name){
        throw new Error("Incomplete registration data");
    }
    return await userRepository.register(userData);
}