import React, { useState } from 'react';
import './AddProduct.css';
import upload_area from '../../assets/upload_area.jpg';

const AddProduct = () => {
    const [imagen, setImagen] = useState(null); // Cambiado a null
    const [productDetails, setProductDetails] = useState({
        nombre: "",
        imagen: "",
        precio_nuevo: "",
        precio_viejo: ""
    });

    const imagenHandler = (e) => {
        setImagen(e.target.files[0]);
    }

    const changeHandler = (e) => {
        setProductDetails({ ...productDetails, [e.target.name]: e.target.value });
    }

    const Add_Product = async () => {
        console.log(productDetails);
        let formData = new FormData();
        formData.append('product', imagen);

        try {
            const response = await fetch('http://localhost:4000/upload', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                },
                body: formData,
            });

            const responseData = await response.json(); 

            if (responseData.success) {
                const product = { ...productDetails, imagen: responseData.image_url }; 
                console.log(product);
                await fetch('http://localhost:4000/addproduct',{
                    method:'POST',
                    headers:{
                        Accept: 'application/json',
                        'Content-Type':'application/json',
                    },
                    body:JSON.stringify(product),
                }).then((resp)=>resp.json()).then((data)=>{
                    data.success?alert("Producto Agregado"):alert("Error")
                })
            } else {
                console.error('Error al cargar imagen:', responseData);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    return (
        <div className='add-product'>
            <div className="addproduct-itemfield">
                <p>Titulo Producto</p>
                <input
                    value={productDetails.nombre}
                    onChange={changeHandler}
                    type="text"
                    name='nombre'
                    placeholder='Escribe Aquí'
                />
            </div>
            <div className="addproduct-price">
                <div className="addproduct-itemfield">
                    <p>Precio</p>
                    <input
                        value={productDetails.precio_viejo}
                        onChange={changeHandler}
                        type="text"
                        name='precio_viejo'
                        placeholder='Escribe Aquí'
                    />
                </div>
                <div className="addproduct-itemfield">
                    <p>Precio de Oferta</p>
                    <input
                        value={productDetails.precio_nuevo}
                        onChange={changeHandler}
                        type="text"
                        name='precio_nuevo'
                        placeholder='Escribe Aquí'
                    />
                </div>
                <div className="addproduct-itemfield">
                    <label htmlFor="file-input">
                        <img src={imagen ? URL.createObjectURL(imagen) : upload_area} className='addproduct-thumbail-img' alt="" />
                    </label>
                    <input onChange={imagenHandler} type="file" name='imagen' id='file-input' hidden />
                </div>
                <button onClick={Add_Product} className='addproduct-btn'>AGREGAR</button>
            </div>
        </div>
    );
}

export default AddProduct;
