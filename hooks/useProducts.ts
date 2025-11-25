
import { useState, useEffect } from 'react';
import { Product, ToastType } from '../types';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch, query, getDocs } from 'firebase/firestore';

export const useProducts = (showToast: (msg: string, type: ToastType) => void) => {
  const [products, setProducts] = useState<Product[]>([]);

  // Listen to PRODUCTS
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const productsData = snapshot.docs.map(doc => doc.data() as Product);
      setProducts(productsData);
    });
    return () => unsubscribe();
  }, []);

  const addProduct = async (product: Product) => {
    try {
        await setDoc(doc(db, "products", product.maSanPham), product);
        showToast('Thêm sản phẩm thành công', 'success');
    } catch (error) {
        console.error(error);
        showToast('Lỗi khi thêm sản phẩm', 'error');
    }
  };

  const deleteProduct = async (maSanPham: string) => {
    if(!window.confirm(`Xóa sản phẩm ${maSanPham}?`)) return;
    try {
        await deleteDoc(doc(db, "products", maSanPham));
        showToast('Xóa sản phẩm thành công', 'info');
    } catch (error) {
        console.error(error);
        showToast('Lỗi khi xóa sản phẩm', 'error');
    }
  };

  const deleteAllProducts = async () => {
    if (!window.confirm("CẢNH BÁO QUAN TRỌNG:\n\nBạn đang thực hiện xóa TOÀN BỘ danh sách sản phẩm.\nHành động này KHÔNG THỂ khôi phục.\n\nBạn có chắc chắn muốn tiếp tục?")) return;

    try {
        const q = query(collection(db, "products"));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            showToast("Danh sách sản phẩm đang trống.", "info");
            return;
        }

        const chunkSize = 450;
        const chunks = [];
        const docs = snapshot.docs;

        for (let i = 0; i < docs.length; i += chunkSize) {
            chunks.push(docs.slice(i, i + chunkSize));
        }

        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        }
        
        showToast("Đã xóa toàn bộ dữ liệu sản phẩm.", "info");
    } catch (error) {
        console.error("Delete all error:", error);
        showToast("Lỗi khi xóa dữ liệu.", "error");
    }
  };

  const importProducts = async (newProducts: Product[]) => {
      try {
          const chunkSize = 450; 
          const chunks = [];
          for (let i = 0; i < newProducts.length; i += chunkSize) {
              chunks.push(newProducts.slice(i, i + chunkSize));
          }
          
          let totalCount = 0;
          for (const chunk of chunks) {
              const batch = writeBatch(db);
              chunk.forEach((p: any) => {
                  if(p.maSanPham) {
                      const ref = doc(db, "products", p.maSanPham);
                      batch.set(ref, p);
                  }
              });
              await batch.commit();
              totalCount += chunk.length;
          }
          
          showToast(`Đã import thành công ${totalCount} sản phẩm lên Cloud.`, 'success');
          return true;
      } catch (error) {
          console.error("Import error:", error);
          showToast("Lỗi khi import sản phẩm", "error");
          return false;
      }
  };

  return {
    products,
    addProduct,
    deleteProduct,
    deleteAllProducts,
    importProducts
  };
};
