import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LinkItem, Profile } from '../../types';
import { supabase, localSimulator, saveLocalLinkDescription } from '../../lib/supabase';
import { RenderIcon } from '../../lib/icons';
import { resolveLinkIcon } from '../../lib/domainIcons';
import { AddEditLinkModal } from './AddEditLinkModal';
import {
  Plus,
  GripVertical,
  Edit2,
  Trash2,
  Sparkles,
  ExternalLink,
  Calendar,
  MousePointerClick,
  ArrowUp,
  ArrowDown,
  Clock,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Share2,
  Loader2,
  Archive,
  ArchiveRestore,
  Eye,
  EyeOff,
  X,
  Check,
  CheckSquare,
  Minus,
} from 'lucide-react';
import { generateLinkDescription } from '../../lib/gemini';

interface ManageLinksTabProps {
  profile: Profile;
  links: LinkItem[];
  setLinks: React.Dispatch<React.SetStateAction<LinkItem[]>>;
  onLinksUpdated: () => void;
}

export const ManageLinksTab: React.FC<ManageLinksTabProps> = ({
  profile,
  links,
  setLinks,
  onLinksUpdated,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'archived'>('all');
  const [selectedLinkIds, setSelectedLinkIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [draggedLinkId, setDraggedLinkId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [generatingAiId, setGeneratingAiId] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Toggle selection for a single link
  const toggleSelectLink = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedLinkIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Toggle is_active
  const handleToggleActive = async (link: LinkItem) => {
    if (!link.id || typeof link.id !== 'string') {
      console.error('[ToggleActive] Invalid link.id:', link);
      showToast('Error: Link ID is missing.');
      return;
    }

    const updatedStatus = !link.is_active;
    try {
      const { error } = await supabase
        .from('links')
        .update({ is_active: updatedStatus, ...(updatedStatus ? { is_archived: false } : {}) })
        .eq('id', link.id);

      if (error) {
        throw error;
      }

      try {
        await localSimulator.from('links').update({ is_active: updatedStatus, ...(updatedStatus ? { is_archived: false } : {}) }).eq('id', link.id);
      } catch {}

      setLinks((prev) =>
        prev.map((l) => (l.id === link.id ? { ...l, is_active: updatedStatus, ...(updatedStatus ? { is_archived: false } : {}) } : l))
      );
      showToast(updatedStatus ? 'Link is now visible publicly.' : 'Link is now hidden.');
      onLinksUpdated();
    } catch (err: any) {
      console.error('Failed toggling active:', err);
      showToast('Failed to update link status.');
    }
  };

  // Toggle is_featured
  const handleToggleFeatured = async (link: LinkItem) => {
    if (!link.id || typeof link.id !== 'string') {
      console.error('[ToggleFeatured] Invalid link.id:', link);
      showToast('Error: Link ID is missing.');
      return;
    }

    const updatedStatus = !link.is_featured;
    try {
      const { error } = await supabase
        .from('links')
        .update({ is_featured: updatedStatus })
        .eq('id', link.id);

      if (error) {
        throw error;
      }

      try {
        await localSimulator.from('links').update({ is_featured: updatedStatus }).eq('id', link.id);
      } catch {}

      setLinks((prev) =>
        prev.map((l) => (l.id === link.id ? { ...l, is_featured: updatedStatus } : l))
      );
      showToast(updatedStatus ? 'Link marked as featured at the top!' : 'Featured removed.');
      onLinksUpdated();
    } catch (err: any) {
      console.error('Failed toggling featured:', err);
      showToast('Failed to update featured status.');
    }
  };

  // Single link deletion
  const handleDeleteLink = async (linkId: string) => {
    if (!linkId || typeof linkId !== 'string') {
      console.error('[DeleteLink] Invalid linkId:', linkId);
      showToast('Error: Cannot delete link without a valid ID.');
      return;
    }

    try {
      setDeletingId(null);

      const { error } = await supabase.from('links').delete().eq('id', linkId);
      if (error) {
        throw error;
      }

      try {
        await localSimulator.from('links').delete().eq('id', linkId);
      } catch {}

      setLinks((prev) => prev.filter((l) => l.id !== linkId));
      setSelectedLinkIds((prev) => prev.filter((id) => id !== linkId));
      showToast('Link deleted successfully.');
      onLinksUpdated();
    } catch (err: any) {
      console.error('Failed deleting link:', err);
      showToast(err.message || 'Failed to delete link.');
      onLinksUpdated();
    }
  };

  // Bulk Toggle Active Status
  const handleBulkToggleActive = async (newActiveState: boolean) => {
    if (selectedLinkIds.length === 0) return;
    setIsBulkProcessing(true);

    try {
      const payload = {
        is_active: newActiveState,
        ...(newActiveState ? { is_archived: false } : {}),
      };

      const { error } = await supabase
        .from('links')
        .update(payload)
        .in('id', selectedLinkIds);

      if (error) {
        console.warn('Supabase bulk update warning:', error);
      }

      for (const id of selectedLinkIds) {
        try {
          await localSimulator.from('links').update(payload).eq('id', id);
        } catch {}
      }

      setLinks((prev) =>
        prev.map((l) =>
          selectedLinkIds.includes(l.id)
            ? { ...l, ...payload }
            : l
        )
      );

      showToast(
        `✓ ${selectedLinkIds.length} link${selectedLinkIds.length > 1 ? 's' : ''} set to ${
          newActiveState ? 'Live (Active)' : 'Hidden (Inactive)'
        }.`
      );
      setSelectedLinkIds([]);
      setIsSelectionMode(false);
      onLinksUpdated();
    } catch (err: any) {
      console.error('Bulk toggle active error:', err);
      showToast('Failed to update link statuses in bulk.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Bulk Archive / Restore
  const handleBulkArchive = async (archive: boolean = true) => {
    if (selectedLinkIds.length === 0) return;
    setIsBulkProcessing(true);

    try {
      const payload = archive
        ? { is_archived: true, is_active: false }
        : { is_archived: false, is_active: true };

      const { error } = await supabase
        .from('links')
        .update(payload)
        .in('id', selectedLinkIds);

      if (error) {
        console.warn('Supabase bulk archive warning:', error);
      }

      for (const id of selectedLinkIds) {
        try {
          await localSimulator.from('links').update(payload).eq('id', id);
        } catch {}
      }

      setLinks((prev) =>
        prev.map((l) =>
          selectedLinkIds.includes(l.id) ? { ...l, ...payload } : l
        )
      );

      showToast(
        `✓ ${selectedLinkIds.length} link${selectedLinkIds.length > 1 ? 's' : ''} ${
          archive ? 'archived' : 'restored'
        }.`
      );
      setSelectedLinkIds([]);
      setIsSelectionMode(false);
      onLinksUpdated();
    } catch (err: any) {
      console.error('Bulk archive error:', err);
      showToast('Failed to archive links in bulk.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedLinkIds.length === 0) return;
    setIsBulkProcessing(true);

    try {
      const count = selectedLinkIds.length;

      const { error } = await supabase
        .from('links')
        .delete()
        .in('id', selectedLinkIds);

      if (error) {
        console.warn('Supabase bulk delete warning:', error);
      }

      for (const id of selectedLinkIds) {
        try {
          await localSimulator.from('links').delete().eq('id', id);
        } catch {}
      }

      setLinks((prev) => prev.filter((l) => !selectedLinkIds.includes(l.id)));
      setSelectedLinkIds([]);
      setIsSelectionMode(false);
      setShowBulkDeleteConfirm(false);
      showToast(`✓ Successfully deleted ${count} link${count > 1 ? 's' : ''}.`);
      onLinksUpdated();
    } catch (err: any) {
      console.error('Bulk delete error:', err);
      showToast('Failed to delete links in bulk.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Quick Generate with Gemini API for an existing link
  const handleQuickAiGenerate = async (link: LinkItem) => {
    if (!link.id) return;
    setGeneratingAiId(link.id);
    try {
      const res = await generateLinkDescription({
        url: link.url,
        title: link.title,
        tone: 'professional',
      });

      if (res.description) {
        saveLocalLinkDescription(link.id, res.description);

        const { error } = await supabase
          .from('links')
          .update({ description: res.description })
          .eq('id', link.id);

        if (error && error.code !== 'PGRST204' && !String(error.message || '').includes('description')) {
          throw error;
        }

        try {
          await localSimulator.from('links').update({ description: res.description }).eq('id', link.id);
        } catch {}

        setLinks((prev) =>
          prev.map((l) => (l.id === link.id ? { ...l, description: res.description } : l))
        );
        showToast(`✨ Generated description for "${link.title}"!`);
        onLinksUpdated();
      }
    } catch (err: any) {
      console.error('Gemini quick description error:', err);
      showToast(err.message || 'Failed to auto-generate description with Gemini.');
    } finally {
      setGeneratingAiId(null);
    }
  };

  // Save new / edited link
  const handleSaveLink = (savedLink: LinkItem) => {
    if (!savedLink || !savedLink.id) {
      console.error('[HandleSaveLink] Attempted to save invalid link:', savedLink);
      showToast('Error: Link was not saved properly.');
      return;
    }

    setLinks((prev) => {
      const exists = prev.some((l) => l.id === savedLink.id);
      if (exists) {
        return prev.map((l) => (l.id === savedLink.id ? savedLink : l));
      } else {
        return [...prev, savedLink];
      }
    });

    onLinksUpdated();
    showToast(editingLink ? 'Link updated.' : 'New link created.');
    setModalOpen(false);
    setEditingLink(null);
  };

  // Drag and drop reordering
  const handleDragStart = (id: string) => {
    setDraggedLinkId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetId: string) => {
    if (!draggedLinkId || draggedLinkId === targetId) return;

    const sourceIndex = links.findIndex((l) => l.id === draggedLinkId);
    const targetIndex = links.findIndex((l) => l.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const newLinks = [...links];
    const [movedLink] = newLinks.splice(sourceIndex, 1);
    newLinks.splice(targetIndex, 0, movedLink);

    const reordered = newLinks.map((link, idx) => ({
      ...link,
      position: idx,
    }));

    setLinks(reordered);
    setDraggedLinkId(null);

    try {
      await Promise.all(
        reordered.map((l) =>
          supabase.from('links').update({ position: l.position }).eq('id', l.id)
        )
      );
      try {
        await Promise.all(
          reordered.map((l) =>
            localSimulator.from('links').update({ position: l.position }).eq('id', l.id)
          )
        );
      } catch {}
      onLinksUpdated();
    } catch (err) {
      console.warn('Reorder position warning:', err);
    }
  };

  const handleDragEnd = () => {
    setDraggedLinkId(null);
  };

  // Move up/down single position
  const handleMove = async (linkId: string, direction: 'up' | 'down') => {
    const currentIndex = links.findIndex((l) => l.id === linkId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= links.length) return;

    const newLinks = [...links];
    const temp = newLinks[currentIndex];
    newLinks[currentIndex] = newLinks[targetIndex];
    newLinks[targetIndex] = temp;

    const reordered = newLinks.map((link, idx) => ({
      ...link,
      position: idx,
    }));

    setLinks(reordered);

    try {
      await Promise.all(
        reordered.map(async (l) => {
          await supabase.from('links').update({ position: l.position }).eq('id', l.id);
          try {
            await localSimulator.from('links').update({ position: l.position }).eq('id', l.id);
          } catch {}
        })
      );
    } catch (err) {
      console.warn('Position update warning:', err);
    }
  };

  // Filtering: search query + status tabs
  const filteredLinks = links.filter((l) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      l.title.toLowerCase().includes(query) ||
      l.url.toLowerCase().includes(query) ||
      (l.description && l.description.toLowerCase().includes(query)) ||
      (l.category && l.category.toLowerCase().includes(query));

    if (filterStatus === 'active') return matchesSearch && l.is_active && !l.is_archived;
    if (filterStatus === 'inactive') return matchesSearch && !l.is_active && !l.is_archived;
    if (filterStatus === 'archived') return matchesSearch && Boolean(l.is_archived);
    return matchesSearch;
  });

  // Toggle Select All filtered links
  const allFilteredSelected =
    filteredLinks.length > 0 &&
    filteredLinks.every((l) => selectedLinkIds.includes(l.id));

  const someFilteredSelected =
    filteredLinks.length > 0 &&
    filteredLinks.some((l) => selectedLinkIds.includes(l.id)) &&
    !allFilteredSelected;

  const toggleSelectAll = () => {
    if (allFilteredSelected || selectedLinkIds.length > 0) {
      // If either all or some are selected, deselect all filtered links
      const filteredIdSet = new Set(filteredLinks.map((l) => l.id));
      setSelectedLinkIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      // User explicitly selects all currently filtered links
      const newIds = new Set([...selectedLinkIds, ...filteredLinks.map((l) => l.id)]);
      setSelectedLinkIds(Array.from(newIds));
    }
  };

  // Helper for schedule status
  const getScheduleBadge = (link: LinkItem) => {
    if (!link.start_date && !link.end_date) return null;
    const now = new Date();
    const hasStarted = !link.start_date || new Date(link.start_date) <= now;
    const hasEnded = link.end_date && new Date(link.end_date) < now;

    if (hasEnded) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded-full">
          <Clock className="w-2.5 h-2.5" /> Expired
        </span>
      );
    }
    if (!hasStarted) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full">
          <Calendar className="w-2.5 h-2.5" /> Scheduled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full">
        <Clock className="w-2.5 h-2.5" /> Time-Limited Active
      </span>
    );
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden min-w-0">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen 3 Header: Your Links + Add New Link button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            Your Links
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage, filter, reorder, toggle visibility, and perform bulk actions across your links.
          </p>
        </div>

        <button
          id="add-new-link-btn"
          onClick={() => {
            setEditingLink(null);
            setModalOpen(true);
          }}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all min-h-[44px] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Link</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      {links.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                id="search-links-input"
                placeholder="Search links by title or URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-9 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold overflow-x-auto shrink-0">
              <button
                type="button"
                id="filter-all-btn"
                onClick={() => {
                  setFilterStatus('all');
                  setSelectedLinkIds([]);
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                  filterStatus === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({links.length})
              </button>
              <button
                type="button"
                id="filter-active-btn"
                onClick={() => {
                  setFilterStatus('active');
                  setSelectedLinkIds([]);
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                  filterStatus === 'active'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Live ({links.filter((l) => l.is_active && !l.is_archived).length})
              </button>
              <button
                type="button"
                id="filter-inactive-btn"
                onClick={() => {
                  setFilterStatus('inactive');
                  setSelectedLinkIds([]);
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                  filterStatus === 'inactive'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hidden ({links.filter((l) => !l.is_active && !l.is_archived).length})
              </button>
              <button
                type="button"
                id="filter-archived-btn"
                onClick={() => {
                  setFilterStatus('archived');
                  setSelectedLinkIds([]);
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                  filterStatus === 'archived'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Archived ({links.filter((l) => Boolean(l.is_archived)).length})
              </button>
            </div>
          </div>

          {/* Master Select All Header Bar (only shown active when user chooses to select or items are selected) */}
          {filteredLinks.length > 0 && (
            isSelectionMode || selectedLinkIds.length > 0 ? (
              <div className="flex items-center justify-between px-1 text-xs text-slate-400 bg-slate-900/80 p-2 rounded-xl border border-indigo-500/20">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    id="select-all-filtered-links-btn"
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 hover:text-slate-200 cursor-pointer transition-colors"
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                        allFilteredSelected
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                          : someFilteredSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                          : 'border-slate-700 bg-slate-900/60'
                      }`}
                    >
                      {allFilteredSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      {someFilteredSelected && <Minus className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="font-semibold text-slate-300">
                      {allFilteredSelected
                        ? 'Deselect All'
                        : someFilteredSelected
                        ? `Deselect All (${selectedLinkIds.length} selected)`
                        : `Select All (${filteredLinks.length})`}
                    </span>
                  </button>

                  <button
                    type="button"
                    id="exit-selection-mode-btn"
                    onClick={() => {
                      setIsSelectionMode(false);
                      setSelectedLinkIds([]);
                    }}
                    className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 transition-colors px-2.5 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700/80 cursor-pointer font-medium"
                    title="Done selecting links"
                  >
                    <X className="w-3 h-3 text-slate-400" />
                    <span>Done</span>
                  </button>

                  {searchQuery && (
                    <span className="text-[11px] text-indigo-400 font-medium">
                      • Filtered {filteredLinks.length} of {links.length} total
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 hidden sm:block">
                  Select links to perform bulk actions
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between px-1 text-xs text-slate-400">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    id="enter-selection-mode-btn"
                    onClick={() => setIsSelectionMode(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition-colors cursor-pointer"
                    title="Select links for bulk actions"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Select Links</span>
                  </button>

                  {searchQuery && (
                    <span className="text-[11px] text-indigo-400 font-medium">
                      • Filtered {filteredLinks.length} of {links.length} total
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 hidden sm:block">
                  Drag <GripVertical className="w-3 h-3 inline text-slate-600" /> to reorder priority
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Floating / Sticky Bulk Action Bar */}
      <AnimatePresence>
        {selectedLinkIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="sticky top-4 z-30 bg-slate-900/95 backdrop-blur-md border border-indigo-500/40 rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                {selectedLinkIds.length}
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {selectedLinkIds.length} link{selectedLinkIds.length > 1 ? 's' : ''} selected
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
                  >
                    {allFilteredSelected ? 'Deselect all' : `Select all (${filteredLinks.length})`}
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedLinkIds([])}
                    className="hover:text-slate-200 cursor-pointer"
                  >
                    Clear selection
                  </button>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Bulk Make Live */}
              <button
                type="button"
                id="bulk-set-live-btn"
                onClick={() => handleBulkToggleActive(true)}
                disabled={isBulkProcessing}
                className="px-3 py-1.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Set selected links to Live"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Set Live</span>
              </button>

              {/* Bulk Make Inactive */}
              <button
                type="button"
                id="bulk-hide-btn"
                onClick={() => handleBulkToggleActive(false)}
                disabled={isBulkProcessing}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Hide selected links"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hide</span>
              </button>

              {/* Bulk Archive / Restore */}
              {filterStatus === 'archived' ? (
                <button
                  type="button"
                  id="bulk-restore-btn"
                  onClick={() => handleBulkArchive(false)}
                  disabled={isBulkProcessing}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Restore selected links to active"
                >
                  <ArchiveRestore className="w-3.5 h-3.5" />
                  <span>Restore</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="bulk-archive-btn"
                  onClick={() => handleBulkArchive(true)}
                  disabled={isBulkProcessing}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Archive selected links"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archive</span>
                </button>
              )}

              {/* Bulk Delete */}
              <button
                type="button"
                id="bulk-delete-btn"
                onClick={() => setShowBulkDeleteConfirm(true)}
                disabled={isBulkProcessing}
                className="px-3 py-1.5 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Delete selected links permanently"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draggable List */}
      {links.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/40">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">No links added yet</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mb-5">
            Start building your LinkNest by adding your social channels, portfolios, or latest projects.
          </p>
          <button
            onClick={() => {
              setEditingLink(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Add Your First Link
          </button>
        </div>
      ) : filteredLinks.length === 0 ? (
        <div className="border border-slate-800 rounded-2xl p-8 text-center bg-slate-900/60 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">
              {searchQuery ? `No links matching "${searchQuery}"` : `No ${filterStatus} links found`}
            </h3>
            <p className="text-xs text-slate-400">
              {searchQuery
                ? 'Try checking for typos or searching a different title or URL.'
                : `You currently do not have any links marked as ${filterStatus}.`}
            </p>
          </div>
          {(searchQuery || filterStatus !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLinks.map((link) => {
            const isDeleting = deletingId === link.id;
            const isSelected = selectedLinkIds.includes(link.id);

            return (
              <div
                key={link.id}
                id={`dashboard-link-row-${link.id}`}
                draggable
                onDragStart={() => handleDragStart(link.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(link.id)}
                onDragEnd={handleDragEnd}
                className={`bg-slate-900 border rounded-2xl p-4 transition-all ${
                  draggedLinkId === link.id
                    ? 'border-indigo-500 shadow-xl bg-slate-800/80 scale-[1.01]'
                    : isSelected
                    ? 'border-indigo-500/80 bg-indigo-950/20 shadow-md shadow-indigo-950/30'
                    : 'border-slate-800 hover:border-slate-700'
                } ${!link.is_active ? 'opacity-65' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    {/* Multi-Select Checkbox - only displayed when user enters Selection Mode */}
                    {(isSelectionMode || selectedLinkIds.length > 0) && (
                      <button
                        type="button"
                        id={`select-link-${link.id}`}
                        onClick={(e) => toggleSelectLink(link.id, e)}
                        aria-label={isSelected ? `Deselect ${link.title}` : `Select ${link.title}`}
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-600/30'
                            : 'bg-slate-950/80 border-slate-700 hover:border-slate-500 text-transparent'
                        }`}
                      >
                        <Check className={`w-3.5 h-3.5 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                      </button>
                    )}

                    {/* Drag Handle */}
                    <div
                      className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800 touch-none shrink-0"
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Icon with domain auto-detection */}
                    {(() => {
                      const { iconKey, platform } = resolveLinkIcon(link.icon, link.url);
                      return (
                        <div
                          className="w-9 h-9 rounded-xl bg-slate-850 border border-slate-700/80 flex items-center justify-center shrink-0 relative transition-colors shadow-sm"
                          style={{
                            color: platform ? platform.brandColor : '#818cf8',
                            backgroundColor: platform ? 'rgba(15, 23, 42, 0.9)' : undefined,
                          }}
                          title={platform ? `${platform.label} domain detected` : link.icon || 'globe'}
                        >
                          <RenderIcon name={iconKey} className="w-4 h-4" />
                          {platform && (
                            <span
                              className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-slate-900 shadow-sm"
                              style={{ backgroundColor: platform.brandColor }}
                            />
                          )}
                        </div>
                      );
                    })()}

                    {/* Info: Title & URL */}
                    <div className="flex-1 min-w-0 pr-1">
                      {/* Title & Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-white truncate max-w-[180px] sm:max-w-xs">
                          {link.title}
                        </h4>
                        {(() => {
                          const { platform } = resolveLinkIcon(link.icon, link.url);
                          if (!platform) return null;
                          return (
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider"
                              style={{
                                backgroundColor: platform.badgeBg,
                                color: platform.brandColor,
                                border: `1px solid ${platform.badgeBorder}`,
                              }}
                            >
                              {platform.label}
                            </span>
                          );
                        })()}
                        {link.is_featured && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Sparkles className="w-2.5 h-2.5" /> Featured
                          </span>
                        )}
                        {link.is_archived && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
                            <Archive className="w-2.5 h-2.5" /> Archived
                          </span>
                        )}
                        {getScheduleBadge(link)}
                      </div>

                      {/* Description if present */}
                      {link.description ? (
                        <p className="text-xs text-indigo-200/90 font-normal mt-0.5 line-clamp-1">
                          {link.description}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">
                          No description added
                        </p>
                      )}

                      <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate max-w-[140px] sm:max-w-xs hover:text-indigo-400 flex items-center gap-1 hover:underline"
                        >
                          <span className="truncate">{link.url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                        </a>

                        <span className="text-slate-600 hidden sm:inline">•</span>

                        {/* Click Counter Badge */}
                        <span className="flex items-center gap-1 text-[11px] text-slate-300 font-medium shrink-0">
                          <MousePointerClick className="w-3 h-3 text-indigo-400" />
                          {link.click_count || 0} clicks
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Reorder Up/Down arrows */}
                  <div className="hidden sm:flex flex-col gap-0.5 text-slate-500 shrink-0">
                    <button
                      id={`move-up-btn-${link.id}`}
                      onClick={() => handleMove(link.id, 'up')}
                      disabled={links.findIndex((l) => l.id === link.id) === 0}
                      className="p-1 hover:text-white disabled:opacity-20 hover:bg-slate-800 rounded min-h-[22px] cursor-pointer"
                      title="Move up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      id={`move-down-btn-${link.id}`}
                      onClick={() => handleMove(link.id, 'down')}
                      disabled={links.findIndex((l) => l.id === link.id) === links.length - 1}
                      className="p-1 hover:text-white disabled:opacity-20 hover:bg-slate-800 rounded min-h-[22px] cursor-pointer"
                      title="Move down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Controls: Active toggle, Featured toggle, Edit, Delete */}
                  <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                    {/* Featured Toggle Star */}
                    <button
                      id={`featured-toggle-${link.id}`}
                      onClick={() => handleToggleFeatured(link)}
                      className={`p-2 rounded-xl border transition-all min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer ${
                        link.is_featured
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-amber-400 hover:border-slate-700'
                      }`}
                      title={link.is_featured ? 'Featured on public page' : 'Mark as featured'}
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>

                    {/* Active / Live Toggle Switch */}
                    <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-xl border border-slate-800">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider select-none flex items-center gap-1 ${
                          link.is_active && !link.is_archived ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {link.is_active && !link.is_archived && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                        {link.is_archived ? 'Archived' : link.is_active ? 'Live' : 'Hidden'}
                      </span>
                      <button
                        id={`active-toggle-${link.id}`}
                        onClick={() => handleToggleActive(link)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          link.is_active && !link.is_archived ? 'bg-emerald-600' : 'bg-slate-800'
                        }`}
                        title={link.is_active ? 'Status: LIVE (Click to hide)' : 'Status: HIDDEN (Click to make LIVE)'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            link.is_active && !link.is_archived ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Quick Gemini AI Auto-Describe */}
                    <button
                      id={`quick-ai-desc-btn-${link.id}`}
                      onClick={() => handleQuickAiGenerate(link)}
                      disabled={generatingAiId === link.id}
                      className="p-2 rounded-xl text-indigo-400 hover:text-white hover:bg-gradient-to-r hover:from-indigo-600/30 hover:to-purple-600/30 border border-indigo-500/30 hover:border-indigo-500/60 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer disabled:opacity-50"
                      title={link.description ? 'Regenerate description with Gemini AI' : 'Auto-generate description with Gemini AI'}
                    >
                      {generatingAiId === link.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-purple-400" />
                      )}
                    </button>

                    {/* Edit button */}
                    <button
                      id={`edit-link-btn-${link.id}`}
                      onClick={() => {
                        setEditingLink(link);
                        setModalOpen(true);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                      title="Edit Link"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      id={`delete-link-btn-${link.id}`}
                      onClick={() => setDeletingId(link.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                      title="Delete Link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Confirm Delete Banner */}
                {isDeleting && (
                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-3 text-xs bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                    <span className="text-rose-300">Are you sure you want to delete this link?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        id={`confirm-delete-btn-${link.id}`}
                        onClick={() => handleDeleteLink(link.id)}
                        className="px-2.5 py-1 bg-rose-600 text-white rounded-lg hover:bg-rose-500 font-semibold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Delete {selectedLinkIds.length} link{selectedLinkIds.length > 1 ? 's' : ''}?
                </h3>
                <p className="text-xs text-slate-400">
                  This action cannot be undone. Selected links will be permanently deleted.
                </p>
              </div>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-300">
              {links
                .filter((l) => selectedLinkIds.includes(l.id))
                .map((l) => (
                  <div key={l.id} className="flex items-center gap-2 truncate">
                    <span className="text-rose-400">•</span>
                    <span className="font-semibold text-white truncate">{l.title}</span>
                    <span className="text-slate-500 truncate text-[11px] font-mono">({l.url})</span>
                  </div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                id="cancel-bulk-delete-btn"
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={isBulkProcessing}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-bulk-delete-btn"
                onClick={handleBulkDelete}
                disabled={isBulkProcessing}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-600/30 cursor-pointer disabled:opacity-50"
              >
                {isBulkProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddEditLinkModal
        isOpen={modalOpen}
        linkToEdit={editingLink}
        profileId={profile.id}
        nextPosition={links.length}
        onClose={() => {
          setModalOpen(false);
          setEditingLink(null);
        }}
        onSave={handleSaveLink}
      />
    </div>
  );
};
