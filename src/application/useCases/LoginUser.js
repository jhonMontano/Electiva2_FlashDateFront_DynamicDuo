export default async function loginUser(email, password, userRepository) {
    if(!email || !password){
        throw new Error("Email and password are required");
    }
    return await userRepository.login(email, password);
}
