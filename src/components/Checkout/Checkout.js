import "./Checkout.css";
import {useState} from "react";
import {useCartContext} from "../../context/CartContext";
import validate from "../../helpers/validate";
import { Navigate } from 'react-router';
import { query, where, documentId, collection, getDocs, Timestamp, writeBatch, addDoc } from  "firebase/firestore";
import { db } from "../../firebase/firebase";
import Swal from 'sweetalert2';
import Form from "../Form/Form";

function Checkout() {

    const {cartList, totalPurchase, emptyCart} = useCartContext();

    const [values, setValues] = useState({
        nombre: "",
        apellido: "",
        telefono: "",
        email: "",
        emailConfirm: "",
    });

    const handleInputChange = (e) => {
        setValues({
            ...values,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate(values)) {return}

        const order = {
            buyer: {...values},
            items: cartList.map(cartItem => {
                const id = cartItem.id; 
                const marca = cartItem.marca;
                const modelo = cartItem.modelo;
                const precio = cartItem.precioEfectivo * cartItem.quantity;

                return ({id, marca, modelo, precio})
            }),
            total: totalPurchase(),
            date: Timestamp.fromDate(new Date())
        }

        const batch = writeBatch(db)

        const ordersCollection = collection(db, "Orders")
        const itemsCollection = collection(db, "ItemCollection")
        const queryStockUpdate = query(itemsCollection, where(documentId(), "in", cartList.map(el => el.id)))

        const outOfStock = []

        const products = await getDocs(queryStockUpdate)

        products.docs.forEach((doc)=>{
            const itemToUpdate = cartList.find(el => el.id === doc.id)

            if(doc.data().stock >
                itemToUpdate.quantity){
                batch.update(doc.ref, {
                    stock: doc.data().stock - itemToUpdate.quantity
                })
            }else {
                outOfStock.push(itemToUpdate)
            }
        })
        if (outOfStock.length === 0) {
            addDoc(ordersCollection, order)
                .then((res)=> {
                    batch.commit()
                    Swal.fire({
                        icon:"success",
                        title:"Su compra se ha realizado exitosamente",
                        text: `Su número de orden es ${res.id}`,
                        confirmButtonColor: "#212529"
                    })
                    emptyCart()
                })
        } else {
            Swal.fire({
                icon:"error",
                title: "Disculpe, no hay stock de los siguientes modelos:",
                text: outOfStock.map(el => el.modelo).join(", "),
                confirmButtonColor: "#212529"
            })
        } 
    }

    return (
        <>
            {cartList.length === 0 
                ? <Navigate to="/"/>
                :
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-lg-12 col-xs-12">
                            <h2 className="texto-resumen">Resumen de Compra</h2>
                            <hr className="hr-resumen" />                      
                        </div>  
                    </div>
                    <div className="row">
                        <div className="col-lg-12 col-xs-12">
                        <Form handleSubmit={handleSubmit} handleInputChange={handleInputChange} values={values.nombre, values.apellido, values.telefono, values.email, values.emailConfirm}/>
                        </div>
                    </div>
                </div>
            }
        </>
    )
}

export default Checkout