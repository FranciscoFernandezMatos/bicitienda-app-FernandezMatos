import { useState, useEffect } from "react";
import { useParams } from "react-router-dom"
import Loading from "../Loading/Loading"
import ItemDetail from "../ItemDetail/ItemDetail.js";
import "./ItemDetailContainer.css"
import { doc, getDoc } from "firebase/firestore"
import {db} from "../../firebase/firebase"

const ItemDetailContainer = () => {
    const [product, setProduct] = useState ({});
    const [loading, setLoading] = useState (true)
    const initial = 1;
    
    const {idProduct} = useParams();

useEffect(() => {
    const queryDataBase = doc(db, "ItemCollection", idProduct)
    getDoc(queryDataBase)
        .then(resp => setProduct( { id: resp.id, ...resp.data() } ))
        .catch((err)=> console.log (err))
        .finally(()=> setLoading(false)) 
    }, [idProduct]) 

    return (
        <div className="container-fluid item-container">
            <div className="row">
                { loading ?
                    <Loading />
                    :
                    <ItemDetail initial={initial} stock={product.stock} product={product}/>               
                }
            </div>
        </div>
    )
}

export default ItemDetailContainer;