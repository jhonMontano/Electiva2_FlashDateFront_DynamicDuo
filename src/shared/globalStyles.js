import { StyleSheet } from "react-native";

export const globalStyles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 15,
        backgroundColor: "#ffffff"
    },
    title: {
        fontSize: 24,
        marginBottom: -10,
        textAlign: "left",
        color: "#000000",
        fontWeight: "bold",
        padding: 30,
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
        color: "#000000",
        textAlign: "center",
        marginTop: 20,
        fontSize: 16,
        fontWeight: "bold",
        textDecorationLine: "underline"
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
    pickerWrapper: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        overflow: "hidden",
        marginBottom: 16,
    },

    picker: {
        height: 50,
        width: "100%",
    },

});
