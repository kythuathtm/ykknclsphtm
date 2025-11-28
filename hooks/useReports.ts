


import { useState, useEffect } from 'react';
import { DefectReport, ToastType } from '../types';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, addDoc, deleteDoc, writeBatch } from 'firebase/firestore';

export const useReports = (showToast: (msg: string, type: ToastType) => void) => {
  const [reports, setReports] = useState<DefectReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  // Listen to REPORTS
  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("ngayTao", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DefectReport[];
      setReports(reportsData);
      setIsLoadingReports(false);
    }, (error) => {
      console.error("Error fetching reports:", error);
      setIsLoadingReports(false);
    });
    return () => unsubscribe();
  }, []);

  const saveReport = async (report: DefectReport, isEditing: boolean) => {
    try {
        if (isEditing && report.id && !report.id.startsWith('new_')) {
            // Update existing
            const reportRef = doc(db, "reports", report.id);
            const { id, ...data } = report;
            await updateDoc(reportRef, data as any);
            showToast('Cập nhật báo cáo thành công!', 'success');
        } else {
            // Create new
            const { id, ...data } = report;
            const newReportData = {
                ...data,
                ngayTao: new Date().toISOString()
            };
            await addDoc(collection(db, "reports"), newReportData);
            showToast('Tạo báo cáo mới thành công!', 'success');
        }
        return true;
    } catch (error) {
        console.error("Error saving report:", error);
        showToast('Lỗi khi lưu báo cáo', 'error');
        return false;
    }
  };

  const updateReport = async (id: string, updates: Partial<DefectReport>, successMessage: string = 'Cập nhật báo cáo thành công!') => {
      try {
          const reportRef = doc(db, "reports", id);
          await updateDoc(reportRef, updates as any);
          showToast(successMessage, 'success');
          return true;
      } catch (error) {
          console.error("Error updating report:", error);
          showToast('Lỗi khi cập nhật báo cáo', 'error');
          return false;
      }
  };

  const deleteReport = async (id: string) => {
    try {
        await deleteDoc(doc(db, "reports", id));
        showToast('Đã xóa báo cáo.', 'info');
        return true;
    } catch (error) {
        console.error("Error deleting:", error);
        showToast('Lỗi khi xóa', 'error');
        return false;
    }
  };

  const deleteMultipleReports = async (ids: string[]) => {
      try {
          const batch = writeBatch(db);
          ids.forEach(id => {
              const ref = doc(db, "reports", id);
              batch.delete(ref);
          });
          await batch.commit();
          showToast(`Đã xóa ${ids.length} báo cáo.`, 'success');
          return true;
      } catch (error) {
          console.error("Batch delete error:", error);
          showToast("Lỗi khi xóa hàng loạt", "error");
          return false;
      }
  }

  return {
    reports,
    isLoadingReports,
    saveReport,
    updateReport,
    deleteReport,
    deleteMultipleReports
  };
};