import { StyleSheet } from "react-native";

export const globalStyles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#fff"
    },
    title: {
        fontSize: 32,
        marginBottom: 20,
        textAlign: "center",
        color: "#e63946",
        fontWeight: "bold"
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 12,
        marginBottom: 12,
        borderRadius: 8
    },
    button: {
        backgroundColor: "#e63946",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold"
    },
    link: {
        color: "#1d3557",
        textAlign: "center",
        marginTop: 20,
        fontSize: 16
    },
    background: {
        flex: 1,
        width: "100%",
        height: "100%",  
        resizeMode: "cover",
      },
      overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.04)",
        justifyContent: "center",
        padding: 20,
      },   
});
