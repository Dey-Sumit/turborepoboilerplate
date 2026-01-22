'use client';

import * as React from 'react';
import {PlayerRef} from '@remotion/player';
import {FolderOpen, Layers, StickyNote} from 'lucide-react';

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
} from '@/components/ui/breadcrumb';
import {Button} from '@/components/ui/button';
import {Dialog, DialogContent, DialogTrigger} from '@/components/ui/dialog';
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
} from '@/components/ui/sidebar';
import useUIStore from '@/zustand/ui-store';
import {S3AssetsPanel} from './s3-assets-panel';
import {TemplatesPanel} from './templates-panel';

const data = {
	nav: [
		{name: 'Templates', icon: Layers},
		{name: 'Assets', icon: FolderOpen},
		{name: 'Notes', icon: StickyNote},
	],
};

interface SettingsDialogProps {
	playerRef: React.RefObject<PlayerRef | null>;
}

export function SettingsDialog({playerRef}: SettingsDialogProps) {
	// Use UI store for external control (keyboard shortcut)
	const isTemplatesDialogOpen = useUIStore(
		(state) => state.isTemplatesDialogOpen,
	);
	const setTemplatesDialogOpen = useUIStore(
		(state) => state.setTemplatesDialogOpen,
	);

	const [activeTab, setActiveTab] = React.useState(data.nav[0].name);

	// Handle open state change - sync with UI store
	const handleOpenChange = React.useCallback(
		(newOpen: boolean) => {
			setTemplatesDialogOpen(newOpen);
		},
		[setTemplatesDialogOpen],
	);
	const buttonRefs = React.useRef<{[key: string]: HTMLButtonElement | null}>(
		{},
	);
	const handleKeyDown = React.useCallback(
		(e: React.KeyboardEvent) => {
			const currentIndex = data.nav.findIndex(
				(item) => item.name === activeTab,
			);
			let nextIndex = currentIndex;

			if (e.key === 'ArrowDown') {
				e.preventDefault();
				nextIndex = (currentIndex + 1) % data.nav.length;
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				nextIndex = (currentIndex - 1 + data.nav.length) % data.nav.length;
			}

			if (nextIndex !== currentIndex) {
				const nextItem = data.nav[nextIndex];
				setActiveTab(nextItem.name);
				buttonRefs.current[nextItem.name]?.focus();
			}
		},
		[activeTab],
	);
	return (
		<Dialog open={isTemplatesDialogOpen} onOpenChange={handleOpenChange}>
			<DialogTrigger>
				<Button size="lg">Open Dialog</Button>
			</DialogTrigger>
			<DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
				<SidebarProvider className="items-start" onKeyDown={handleKeyDown}>
					<Sidebar collapsible="none" className="hidden md:flex">
						<SidebarContent>
							<SidebarGroup>
								<SidebarGroupContent>
									<SidebarMenu className="space-y-2">
										{data.nav.map((item) => (
											<SidebarMenuItem key={item.name}>
												<SidebarMenuButton
													isActive={item.name === activeTab}
													ref={(el) => {
														buttonRefs.current[item.name] = el;
													}}
													onClick={() => setActiveTab(item.name)}
													className="focus-visible:ring-ring"
												>
													<item.icon className="size-4" />
													<span>{item.name}</span>
												</SidebarMenuButton>
											</SidebarMenuItem>
										))}
									</SidebarMenu>
								</SidebarGroupContent>
							</SidebarGroup>
						</SidebarContent>
					</Sidebar>
					<main className="flex h-[480px] flex-1 flex-col overflow-hidden">
						<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
							<div className="flex items-center gap-2 px-4">
								<Breadcrumb>
									<BreadcrumbList>
										<BreadcrumbItem className="hidden md:block">
											<BreadcrumbLink href="#">{activeTab}</BreadcrumbLink>
										</BreadcrumbItem>
									</BreadcrumbList>
								</Breadcrumb>
							</div>
						</header>
						<div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
							{activeTab === 'Assets' && <S3AssetsPanel />}
							{activeTab === 'Templates' && (
								<TemplatesPanel
									playerRef={playerRef}
									onClose={() => handleOpenChange(false)}
								/>
							)}
							{activeTab === 'Notes' && (
								<div className="space-y-4">
									{['Project Ideas', 'Meeting Minutes', 'Drafts'].map(
										(note) => (
											<div
												key={note}
												className="border-border bg-muted/30 hover:bg-muted/50 flex cursor-pointer flex-col gap-1 rounded-lg border p-4 transition-colors"
											>
												<p className="text-foreground text-sm font-medium">
													{note}
												</p>
												<p className="text-muted-foreground text-xs">
													Last edited 2 hours ago
												</p>
											</div>
										),
									)}
								</div>
							)}
						</div>
					</main>
				</SidebarProvider>
			</DialogContent>
		</Dialog>
	);
}
