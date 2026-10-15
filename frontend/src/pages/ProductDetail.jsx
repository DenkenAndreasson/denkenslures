import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../apiConfig.js";
import { useCart } from "../context/CartContext.jsx";
import { useCurrency } from "../context/CurrencyContext.jsx";
import NavBar from "./NavBar.jsx";
import { productImage, productVariants } from "../productInfo.js";

function ProductDetail() {
  let { id } = useParams();
  let navigate = useNavigate();
  let { addToCart } = useCart();
  let { formatPrice } = useCurrency();
  let [product, setProduct] = useState(null);
  let [quantity, setQuantity] = useState(1);
  let [error, setError] = useState(null);

  useEffect(() => {
    let loadProduct = async () => {
      try {
        let response = await fetch(`${API_URL}/products/${id}`);
        if (!response.ok) throw new Error();
        let data = await response.json();
        setProduct(data);
      } catch {
        setError("Kunde inte hämta produkten.");
      }
    };

    loadProduct();
  }, [id]);

  let handleAddToCart = () => {
    addToCart(product, quantity);
    navigate("/varukorg");
  };

  if (error) {
    return (
      <div className="shop-page">
        <NavBar />
        <div className="shop-content">
          <p className="shop-error">{error}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="shop-page">
        <NavBar />
        <div className="shop-content">
          <p>Laddar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-page">
      <NavBar />
      <div className="shop-content">
        <Link to="/" className="shop-back-link">
          ‹ Tillbaka
        </Link>

        <div className="shop-detail">
          <img src={productImage(product)} alt={product.name} />

          <div className="shop-detail-info">
            <h2>{product.name}</h2>
            <p className="shop-detail-price">{formatPrice(product.price)}</p>
            <p className="shop-detail-description">{product.description}</p>

            <div className="shop-detail-specs">
              {product.model && (
                <div>
                  <span className="shop-label">Modell</span>
                  <span>{product.model}</span>
                </div>
              )}
              {product.size && (
                <div>
                  <span className="shop-label">Storlek</span>
                  <span>{product.size}</span>
                </div>
              )}
              {product.category && (
                <div>
                  <span className="shop-label">Kategori</span>
                  <span>{product.category}</span>
                </div>
              )}
              {productVariants(product).length > 0 && (
                <div>
                  <span className="shop-label">Varianter</span>
                  <span>{productVariants(product).join(", ")}</span>
                </div>
              )}
              {product.ean && (
                <div>
                  <span className="shop-label">EAN</span>
                  <span>{product.ean}</span>
                </div>
              )}
            </div>

            <div className="shop-detail-actions">
              <div className="shop-quantity">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span>{quantity}</span>
                <button type="button" onClick={() => setQuantity((q) => q + 1)}>
                  +
                </button>
              </div>
              <button
                type="button"
                className="shop-btn shop-btn-primary"
                onClick={handleAddToCart}
              >
                Lägg i varukorg
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
