const Landing = () => {
	return (
		<div className="bg-ci-white flex min-h-screen flex-col">
			<div className="">
				<div className="px-4 md:px-8">
					<div className="mx-auto border-x">
						<div className="text-ci-dark flex flex-col text-sm md:flex-row md:items-center md:justify-between">
							<div className="text-ci-dark flex w-full flex-wrap items-center justify-end space-x-2 px-4">
								<a
									aria-label="Sign in"
									className="text-ci-dark inline-flex size-9 items-center justify-center rounded-full transition-colors"
									href="/account/login"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="20"
										height="20"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										className="lucide lucide-user h-[16px] w-[16px]"
									>
										<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
										<circle cx="12" cy="7" r="4"></circle>
									</svg>
								</a>
								<a
									className="text-ci-black relative inline-flex items-center"
									href="/cart"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										className="lucide lucide-shopping-cart-icon lucide-shopping-cart h-4 w-4"
									>
										<circle cx="8" cy="21" r="1"></circle>
										<circle cx="19" cy="21" r="1"></circle>
										<path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
									</svg>
								</a>
								<a
									href="https://x.com/agenticvideoeditor"
									target="_blank"
									rel="noopener noreferrer"
									className="text-ci-dark hover:text-ci-purple inline-flex size-8 items-center justify-center rounded-full transition-colors"
									aria-label="Follow us on X (Twitter)"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="currentColor"
										aria-hidden="true"
									>
										<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
									</svg>
								</a>
								<a
									href="https://www.linkedin.com/company/agenticvideoeditor"
									target="_blank"
									rel="noopener noreferrer"
									className="text-ci-dark hover:text-ci-purple inline-flex size-8 items-center justify-center rounded-full transition-colors"
									aria-label="Follow us on LinkedIn"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="currentColor"
										aria-hidden="true"
									>
										<path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path>
									</svg>
								</a>
							</div>
						</div>
					</div>
				</div>
				<nav className="border-ci-grey relative border-y px-4 md:px-8">
					<div className="bg-ci-white border-ci-grey absolute top-[0px] left-3 z-100 size-[9px] rounded-sm border shadow md:-top-[5px] md:left-[28px]"></div>
					<div className="bg-ci-white border-ci-grey absolute top-[0px] right-3 z-100 size-[9px] rounded-sm border shadow md:-top-[5px] md:right-[28px]"></div>
					<div className="bg-ci-white border-ci-grey absolute top-[61px] left-3 z-100 size-[9px] rounded-sm border shadow md:top-[62px] md:left-[28px]"></div>
					<div className="bg-ci-white border-ci-grey absolute top-[61px] right-3 z-100 size-[9px] rounded-sm border shadow md:top-[62px] md:right-[28px]"></div>
					<div className="border-ci-grey mx-auto flex items-center justify-between border-x py-4">
						<div className="flex items-center gap-10 px-4">
							<a className="flex items-center gap-1" href="/">
								<div className="flex items-center justify-center">
									<img
										alt="Agentic Video Editor"
										loading="lazy"
										width="30"
										height="30"
										decoding="async"
										data-nimg="1"
										className="mr-1 size-6 xl:size-8"
										style={{color: 'transparent'}}
										src="/logo.svg"
									/>
								</div>
								<div
									className="relative flex gap-1 overflow-visible text-xl leading-tight font-semibold transition-opacity duration-500"
									style={{opacity: 1}}
								>
									<span>Agentic</span>
									<span className="text-ci-dark font-normal">Video Editor</span>
								</div>
							</a>
							<div className="hidden pt-0.5 lg:flex xl:ml-0">
								<ul className="flex items-center gap-5">
									<li
										className="relative flex items-center"
										style={{transitionDelay: '0.05s'}}
									>
										<a className="font-medium" href="/blog">
											Blog
										</a>
									</li>
									<li className="bg-ci-grey/60 h-4 w-px"></li>
									<li
										className="relative flex items-center"
										style={{transitionDelay: '0.12s'}}
									>
										<a className="font-medium" href="/showcase">
											Showcase
										</a>
									</li>
									<li className="bg-ci-grey/60 h-4 w-px"></li>
									<li
										className="relative flex items-center"
										style={{transitionDelay: '0.19s'}}
									>
										<a className="font-medium" href="/features">
											Features
										</a>
									</li>
									<li className="bg-ci-grey/60 h-4 w-px"></li>
									<li
										className="relative flex items-center"
										style={{transitionDelay: '0.26s'}}
									>
										<a className="font-medium" href="/templates">
											Templates
										</a>
									</li>
									<li className="bg-ci-grey/60 h-4 w-px"></li>
									<li
										className="relative flex items-center"
										style={{transitionDelay: '0.4s'}}
									>
										<a className="font-medium" href="/ai">
											AI
										</a>
									</li>
									<li className="bg-ci-grey/60 h-4 w-px"></li>
									<li
										className="relative flex items-center"
										style={{transitionDelay: '0.47s'}}
									>
										<a className="font-medium" href="/pricing">
											Pricing
										</a>
									</li>
									<li className="bg-ci-grey/60 h-4 w-px"></li>
									<li
										className="relative flex h-full items-center"
										style={{transitionDelay: '0.05s'}}
									>
										<button className="flex h-full items-center gap-1 font-medium">
											Free Tools
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
												className="transition-transform duration-200"
											>
												<path d="m6 9 6 6 6-6"></path>
											</svg>
										</button>
										<div className="border-ci-grey invisible absolute top-full right-0 z-50 w-[600px] origin-top-right -translate-y-2 overflow-hidden rounded-lg border bg-white opacity-0 shadow-lg transition-all duration-200">
											<div className="grid grid-cols-2 gap-4 p-6">
												<a
													className="group hover:border-ci-grey/20 block rounded-lg border border-transparent p-4 transition-colors hover:bg-gray-50"
													href="/video-editor"
												>
													<div className="relative mb-3 aspect-video overflow-hidden rounded-md bg-gray-100">
														<div className="absolute inset-0 flex items-center justify-center text-gray-400">
															<svg
																xmlns="http://www.w3.org/2000/svg"
																width="40"
																height="40"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																strokeWidth="1"
																strokeLinecap="round"
																strokeLinejoin="round"
															>
																<path d="M12.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v10"></path>
																<path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
																<path d="M3 15h6"></path>
																<path d="M3 18h6"></path>
															</svg>
														</div>
													</div>
													<h3 className="text-ci-black group-hover:text-ci-purple font-semibold transition-colors">
														Agentic Video Editor
													</h3>
													<p className="mt-1 line-clamp-2 text-sm text-gray-500">
														Edit and generate videos with AI. Smart trimming, auto effects, advanced timeline.
													</p>
												</a>
												<a
													className="group hover:border-ci-grey/20 block rounded-lg border border-transparent p-4 transition-colors hover:bg-gray-50"
													href="/video-templates"
												>
													<div className="relative mb-3 aspect-video overflow-hidden rounded-md bg-gray-100">
														<div className="absolute inset-0 flex items-center justify-center text-gray-400">
															<svg
																xmlns="http://www.w3.org/2000/svg"
																width="40"
																height="40"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																strokeWidth="1"
																strokeLinecap="round"
																strokeLinejoin="round"
															>
																<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
															</svg>
														</div>
													</div>
													<h3 className="text-ci-black group-hover:text-ci-purple font-semibold transition-colors">
														Video Templates
													</h3>
													<p className="mt-1 line-clamp-2 text-sm text-gray-500">
														Use AI-powered templates for faster content creation. Intros, reels, and ads.
													</p>
												</a>
											</div>
										</div>
									</li>
								</ul>
							</div>
						</div>
						<ul className="hidden list-none items-center space-x-4 px-4 font-medium lg:flex xl:space-x-6">
							<li className="relative" style={{transitionDelay: '0.15s'}}>
								<a className="font-medium" href="/hire-video-experts">
									Hire Us
								</a>
								<span className="absolute top-2 -left-4 flex h-2 w-2">
									<span className="bg-ci-purple absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
									<span className="bg-ci-purple relative inline-flex h-2 w-2 rounded-full"></span>
								</span>
							</li>
							<li className="pl-4" style={{transitionDelay: '0.25s'}}>
								<a className="ui-btn" href="/submit-video">
									Submit
								</a>
							</li>
						</ul>
						<button className="mr-4 lg:hidden">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								className="h-6 w-6"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M4 6h16M4 12h16m-7 6h7"
								></path>
							</svg>
						</button>
					</div>
				</nav>
			</div>
			<div className="grow">
				<div className="mx-auto px-4 md:px-8">
					<div className="border-ci-grey relative overflow-hidden border-x border-b pt-14">
						<div className="relative z-10">
							<div className="relative z-5">
								<div className="px-4">
									<div className="ui-tag-shadow">
										<img
											alt="Agentic Video Editor Logo"
											loading="lazy"
											width="24"
											height="24"
											decoding="async"
											data-nimg="1"
											className="mr-1 -ml-2 h-5 w-5"
											src="/threejs.svg"
											style={{
												color: 'transparent',
											}}
										/>
										Agentic Video Editor Suite
									</div>
								</div>
								<h1 className="text-ci-black relative z-5 mb-4 px-4">
									AI-powered Video Editing for Creators and Businesses,
									<br /> Fast, Intuitive, and Agentic.
								</h1>
								<div className="border-ci-grey border-y px-4 py-4">
									<p className="text-md relative z-5 max-w-7xl text-gray-600">
										Discover Agentic Video Editor: The next-gen video creation platform for effortless AI editing, automation, and professional results.
										<br />
										Edit, enhance, and publish videos faster with smart tools, templates, and AI agents—designed for YouTubers, marketers, and teams.
									</p>
								</div>
								<div className="relative flex flex-col gap-4 px-4 py-6 md:flex-row">
									<div className="ui-background-lines"></div>
									<a href="/submit-video">
										<button className="ui-btn relative z-5 !px-6">
											Submit Your Video
										</button>
									</a>
									<a href="/templates">
										<button className="ui-btn-purple relative z-5">
											Explore Templates
										</button>
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Landing;
