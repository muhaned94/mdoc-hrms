import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import CompanyMap from '../../../components/common/CompanyMap/CompanyMap';
import {
    Box,
    Typography,
    CircularProgress,
    Paper,
    Breadcrumbs,
    Link as MuiLink
} from '@mui/material';
import { Link } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const CompanyTreePage = () => {
    const [treeData, setTreeData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTreeData();
    }, []);

    const fetchTreeData = async () => {
        try {
            const { data, error } = await supabase
                .from('company_structure')
                .select('*');

            if (error) throw error;

            if (data) {
                const hierarchy = buildHierarchy(data);
                setTreeData(hierarchy);
            }
        } catch (error) {
            console.error('Error fetching tree data:', error);
        } finally {
            setLoading(false);
        }
    };

    const buildHierarchy = (nodes) => {
        if (!nodes || nodes.length === 0) return null;
        const nodeMap = new Map();
        const rootNodes = [];
        nodes.forEach(node => {
            nodeMap.set(node.id, { ...node, children: [] });
        });
        nodes.forEach(node => {
            const mappedNode = nodeMap.get(node.id);
            if (node.parent_id) {
                const parent = nodeMap.get(node.parent_id);
                if (parent) parent.children.push(mappedNode);
                else rootNodes.push(mappedNode); // Parent not in list
            } else {
                rootNodes.push(mappedNode);
            }
        });

        if (rootNodes.length === 0) return null;
        if (rootNodes.length === 1) return rootNodes[0];

        // Multiple roots - create a virtual one or return the first one
        // For HRMS, usually there's one General Manager
        return rootNodes.find(n => (n.name || '').includes('مدير عام')) || rootNodes[0];
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f5f7fa' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a237e', mb: 1 }}>مخطط شجرة الشركة</Typography>
                    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
                        <MuiLink component={Link} underline="hover" color="inherit" to="/admin">
                            لوحة التحكم
                        </MuiLink>
                        <Typography sx={{ color: '#1a237e', fontWeight: 600 }}>مخطط الشجرة</Typography>
                    </Breadcrumbs>
                </Box>
            </Box>

            <Paper
                elevation={0}
                sx={{
                    height: 'calc(100vh - 240px)',
                    width: '100%',
                    overflow: 'hidden',
                    borderRadius: "24px",
                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.05)'
                }}
            >
                {treeData ? (
                    <CompanyMap data={treeData} />
                ) : (
                    <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Typography variant="h6" color="text.secondary">لا توجد بيانات متاحة حالياً</Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default CompanyTreePage;
