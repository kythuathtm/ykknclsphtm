
import { useState, useEffect } from 'react';
import { DefectReport, ToastType, ActivityLog } from '../types';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, setDoc, deleteDoc, writeBatch, arrayUnion } from 'firebase/firestore';

const LS_REPORTS = 'app_reports_data';

// Removed mock data as requested
const MOCK_REPORTS: DefectReport[] = [];

// Helper to clean data for Firestore
const cleanData = (data: any): any => {
    if (data instanceof Date) return data;
    if (Array.isArray(data)) return data.map(cleanData);
    else if (data !== null && typeof data === 'object') {
        return Object.entries(data).reduce((acc, [key, value]) => {
            if (value !== undefined) acc[key] = cleanData(value);
            return acc;
        }, {} as any);
    }
    return data;
};

export const useReports = (showToast: (msg: string, type: ToastType) => void) => {
  const [reports, setReports] = useState<DefectReport[]>(() => {
      try {
          const saved = localStorage.getItem(LS_REPORTS);
          return saved ? JSON.parse(saved) : MOCK_REPORTS;
      } catch { return MOCK_REPORTS; }
  });
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  // Update Local Storage Helper
  const updateLocal = (newReports: DefectReport[]) => {
      setReports(newReports);
      localStorage.setItem(LS_REPORTS, JSON.stringify(newReports));
  };

  useEffect(() => {
    let unsubscribe = () => {};
    try {
        const q = query(collection(db, "reports"), orderBy("ngayTao", "desc"));
        unsubscribe = onSnapshot(q, 
            (snapshot) => {
                const reportsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as DefectReport[];
                
                updateLocal(reportsData);
                setIsLoadingReports(false);
            }, 
            (error: any) => {
                if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
                    console.info("Reports: Firestore permission denied. Using local data (Offline Mode).");
                } else {
                    console.warn("Error fetching reports (Offline Mode):", error);
                }
                setIsLoadingReports(false);
            }
        );
    } catch (error) {
        console.warn("Reports: Init failed or offline, using local data.");
        setIsLoadingReports(false);
    }
    return () => unsubscribe();
  }, []);

  const saveReport = async (report: DefectReport, isEditing: boolean) => {
    // Optimistic UI Update
    let newReports = [...reports];
    let firestorePromise;

    if (isEditing && report.id && !report.id.startsWith('new_') && !report.id.startsWith('local_')) {
        const idx = newReports.findIndex(r => r.id === report.id);
        if (idx >= 0) newReports[idx] = report;
        
        const reportRef = doc(db, "reports", report.id);
        const { id, ...data } = report;
        firestorePromise = updateDoc(reportRef, cleanData(data));
    } else {
        // GENERATE NEW ID: YYYY-XXX
        const reportDate = new Date(report.ngayPhanAnh);
        const year = reportDate.getFullYear();
        const prefix = `${year}-`;
        
        // Find existing IDs for this year to increment sequence
        const sequences = reports
            .filter(r => r.id && r.id.startsWith(prefix))
            .map(r => {
                const parts = r.id.split('-');
                // Check if part[1] is a valid number
                return parts.length === 2 && !isNaN(Number(parts[1])) ? parseInt(parts[1], 10) : 0;
            });
            
        const maxSeq = sequences.length > 0 ? Math.max(...sequences) : 0;
        const nextSeq = maxSeq + 1;
        const newId = `${prefix}${String(nextSeq).padStart(3, '0')}`;

        const newReport = { ...report, id: newId, ngayTao: new Date().toISOString(), activityLog: [] };
        newReports = [newReport, ...newReports];
        
        const { id, ...data } = newReport;
        
        // Use setDoc to create document with specific ID
        firestorePromise = setDoc(doc(db, "reports", newId), cleanData(data));
    }
    updateLocal(newReports);

    try {
        await firestorePromise;
        showToast(isEditing ? 'Cập nhật thành công!' : 'Tạo mới thành công!', 'success');
        return true;
    } catch (error: any) {
        console.info("Offline save: report (local only)");
        showToast('Đã lưu (Offline mode)', 'success');
        return true;
    }
  };

  const updateReport = async (id: string, updates: Partial<DefectReport>, successMessage: string = 'Cập nhật thành công!', user?: { username: string, role: string }) => {
      // Optimistic
      const updatedReports = reports.map(r => {
          if (r.id === id) {
              const updatedR = { ...r, ...updates };
              if (user) {
                  const log: ActivityLog = {
                      id: `log_${Date.now()}`,
                      type: 'log',
                      content: updates.trangThai ? `Trạng thái: ${updates.trangThai}` : 'Cập nhật thông tin',
                      timestamp: new Date().toISOString(),
                      user: user.username,
                      role: user.role
                  };
                  updatedR.activityLog = [...(updatedR.activityLog || []), log];
              }
              return updatedR;
          }
          return r;
      });
      updateLocal(updatedReports);

      try {
          const reportRef = doc(db, "reports", id);
          const payload: any = { ...updates };
          if (user) {
               const log: ActivityLog = {
                  id: `log_${Date.now()}`,
                  type: 'log',
                  content: updates.trangThai ? `Trạng thái: ${updates.trangThai}` : 'Cập nhật thông tin',
                  timestamp: new Date().toISOString(),
                  user: user.username,
                  role: user.role
              };
              payload.activityLog = arrayUnion(log);
          }
          await updateDoc(reportRef, cleanData(payload));
          showToast(successMessage, 'success');
          return true;
      } catch (error: any) {
          console.info("Offline update: report (local only)");
          showToast(successMessage + ' (Offline)', 'success');
          return true;
      }
  };

  const addComment = async (reportId: string, content: string, user: { username: string, role: string }) => {
      // Optimistic
      const newComment: ActivityLog = {
          id: `cmt_${Date.now()}`,
          type: 'comment',
          content: content,
          timestamp: new Date().toISOString(),
          user: user.username,
          role: user.role
      };

      const updatedReports = reports.map(r => {
          if (r.id === reportId) {
              return { ...r, activityLog: [...(r.activityLog || []), newComment] };
          }
          return r;
      });
      updateLocal(updatedReports);

      try {
          const reportRef = doc(db, "reports", reportId);
          await updateDoc(reportRef, { activityLog: arrayUnion(newComment) });
          return true;
      } catch (error) {
          console.info("Offline comment (local only)");
          return true; 
      }
  };

  const deleteReport = async (id: string) => {
    // Optimistic
    const remaining = reports.filter(r => r.id !== id);
    updateLocal(remaining);
    
    try {
        await deleteDoc(doc(db, "reports", id));
        showToast('Đã xóa báo cáo.', 'info');
        return true;
    } catch (error: any) {
        console.info("Offline delete (local only)");
        showToast('Đã xóa (Offline mode)', 'info');
        return true;
    }
  };

  const importReports = async (newReports: DefectReport[]) => {
      try {
          // Local Only import for now as batch writing all might fail partly or trigger permissions
          const combined = [...newReports.map(r => ({...r, id: `imp_${Date.now()}_${Math.random()}`})), ...reports];
          updateLocal(combined);
          showToast(`Đã import ${newReports.length} phiếu (Offline/Local).`, 'success');
          return true;
      } catch (e) { return false; }
  };

  return {
    reports,
    isLoadingReports,
    saveReport,
    updateReport,
    addComment,
    deleteReport,
    importReports
  };
};
