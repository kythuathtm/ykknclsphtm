
import { useState, useEffect } from 'react';
import { Customer, ToastType } from '../types';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, writeBatch, query, getDocs } from 'firebase/firestore';

const LS_CUSTOMERS = 'app_customers_data';

export const useCustomers = (showToast: (msg: string, type: ToastType) => void) => {
  const [customers, setCustomers] = useState<Customer[]>(() => {
      try {
          const saved = localStorage.getItem(LS_CUSTOMERS);
          return saved ? JSON.parse(saved) : [];
      } catch { return []; }
  });

  useEffect(() => {
    let unsubscribe = () => {};
    try {
        const customersRef = collection(db, "customers");
        unsubscribe = onSnapshot(customersRef, 
            (snapshot) => {
                const customersData = snapshot.docs.map(doc => doc.data() as Customer);
                if (customersData.length > 0 || !snapshot.metadata.fromCache) {
                    setCustomers(customersData);
                    localStorage.setItem(LS_CUSTOMERS, JSON.stringify(customersData));
                }
            },
            (error: any) => {
                if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
                    console.info("Customer: Firestore permission denied. Using local data (Offline Mode).");
                } else {
                    console.warn("Customer Listener Error (Offline Mode):", error);
                }
            }
        );
    } catch (e) {
        console.warn("Customer: Init failed or offline, using local storage.");
    }
    return () => unsubscribe();
  }, []);

  const addCustomer = async (customer: Customer) => {
    // Optimistic
    const newCustomers = [...customers.filter(c => c.maKhachHang !== customer.maKhachHang), customer];
    setCustomers(newCustomers);
    localStorage.setItem(LS_CUSTOMERS, JSON.stringify(newCustomers));

    try {
        await setDoc(doc(db, "customers", customer.maKhachHang), customer);
        showToast('Thêm khách hàng thành công', 'success');
    } catch (error: any) {
        console.info("Offline add: customer (local only)");
        showToast('Đã lưu khách hàng (Offline mode)', 'info');
    }
  };

  const updateCustomer = async (originalMaKhachHang: string, updatedData: Customer) => {
      // Optimistic Update
      const newCustomers = customers.map(c => c.maKhachHang === originalMaKhachHang ? updatedData : c);
      
      // If ID changed, we need to handle duplication check locally for UI immediately
      if (originalMaKhachHang !== updatedData.maKhachHang) {
          if (customers.some(c => c.maKhachHang === updatedData.maKhachHang)) {
              showToast('Mã khách hàng mới đã tồn tại!', 'error');
              return false;
          }
      }

      setCustomers(newCustomers);
      localStorage.setItem(LS_CUSTOMERS, JSON.stringify(newCustomers));

      try {
          if (originalMaKhachHang === updatedData.maKhachHang) {
              // Just update fields
              await updateDoc(doc(db, "customers", originalMaKhachHang), { ...updatedData });
          } else {
              // ID changed: Create new doc, delete old doc
              const batch = writeBatch(db);
              batch.set(doc(db, "customers", updatedData.maKhachHang), updatedData);
              batch.delete(doc(db, "customers", originalMaKhachHang));
              await batch.commit();
          }
          showToast('Cập nhật thông tin thành công', 'success');
          return true;
      } catch (error: any) {
          console.info("Offline update: customer (local only)");
          showToast('Đã lưu thay đổi (Offline mode)', 'info');
          return true;
      }
  };

  const deleteCustomer = async (maKhachHang: string) => {
    if(!window.confirm(`Xóa khách hàng ${maKhachHang}?`)) return;
    
    // Optimistic
    const newCustomers = customers.filter(c => c.maKhachHang !== maKhachHang);
    setCustomers(newCustomers);
    localStorage.setItem(LS_CUSTOMERS, JSON.stringify(newCustomers));

    try {
        await deleteDoc(doc(db, "customers", maKhachHang));
        showToast('Xóa khách hàng thành công', 'info');
    } catch (error: any) {
        console.info("Offline delete: customer (local only)");
        showToast('Đã xóa khách hàng (Offline mode)', 'info');
    }
  };

  const deleteAllCustomers = async () => {
    if (!window.confirm("CẢNH BÁO: Xóa toàn bộ danh sách khách hàng?")) return;

    // Optimistic
    setCustomers([]);
    localStorage.removeItem(LS_CUSTOMERS);

    try {
        const q = query(collection(db, "customers"));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        showToast("Đã xóa toàn bộ dữ liệu khách hàng.", "info");
    } catch (error: any) {
        console.info("Offline delete all: customers (local only)");
        showToast("Đã xóa dữ liệu (Offline mode).", "info");
    }
  };

  const importCustomers = async (newCustomers: Customer[]) => {
      // Optimistic merge
      const combined = [...customers];
      newCustomers.forEach(nc => {
          const idx = combined.findIndex(c => c.maKhachHang === nc.maKhachHang);
          if (idx >= 0) combined[idx] = nc;
          else combined.push(nc);
      });
      setCustomers(combined);
      localStorage.setItem(LS_CUSTOMERS, JSON.stringify(combined));

      try {
          const batch = writeBatch(db);
          newCustomers.forEach((c) => {
              const ref = doc(db, "customers", c.maKhachHang);
              batch.set(ref, c);
          });
          await batch.commit();
          showToast(`Đã import thành công ${newCustomers.length} khách hàng.`, 'success');
          return true;
      } catch (error: any) {
          console.info("Offline import: customers (local only)");
          showToast(`Đã import ${newCustomers.length} khách hàng (Offline mode).`, 'success');
          return true;
      }
  };

  return {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    deleteAllCustomers,
    importCustomers
  };
};
