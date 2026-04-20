(() => {
  const INPUT_STATE_KEY = "autofigure_input_state_v1";
  const TEMPLATE_INPUT_STATE_KEY = "autofigure_template_input_state_v1";

  const page = document.body.dataset.page;
  if (page === "input") {
    initInputPage();
  } else if (page === "template-input") {
    initTemplateInputPage();
  } else if (page === "canvas") {
    initCanvasPage();
  }

  function $(id) {
    return document.getElementById(id);
  }

  function loadStoredState(key) {
    try {
      const raw = window.sessionStorage.getItem(key);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (_err) {
      return null;
    }
  }

  function isLocalVllmProvider(value) {
    return value === "local_vllm";
  }

  function saveStoredState(key, state) {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(state));
    } catch (_err) {
      // Ignore storage failures (e.g. private mode / quota)
    }
  }

  function initInputPage() {
    const confirmBtn = $("confirmBtn");
    const errorMsg = $("errorMsg");
    const templatePageBtn = $("templatePageBtn");
    const inputMode = $("inputMode");
    const methodFields = $("methodFields");
    const methodTextInput = $("methodText");
    const uploadZone = $("uploadZone");
    const referenceFile = $("referenceFile");
    const referencePreview = $("referencePreview");
    const referenceStatus = $("referenceStatus");
    const uploadLabel = $("uploadLabel");
    const uploadText = $("uploadText");
    const uploadHint = $("uploadHint");
    const imageSizeGroup = $("imageSizeGroup");
    const imageSizeInput = $("imageSize");
    const samBackend = $("samBackend");
    const samPrompt = $("samPrompt");
    const samApiKeyGroup = $("samApiKeyGroup");
    const samApiKeyInput = $("samApiKey");
    const samCheckpointPathGroup = $("samCheckpointPathGroup");
    const samCheckpointPathInput = $("samCheckpointPath");
    let uploadedReferencePath = null;

    function getMode() {
      return inputMode?.value === "image" ? "image" : "text";
    }

    function saveInputState() {
      const state = {
        inputMode: getMode(),
        methodText: methodTextInput?.value ?? "",
        provider: $("provider")?.value ?? "gemini",
        apiKey: $("apiKey")?.value ?? "",
        baseUrl: $("baseUrl")?.value ?? "",
        svgModel: $("svgModel")?.value ?? "",
        optimizeIterations: $("optimizeIterations")?.value ?? "0",
        imageSize: imageSizeInput?.value ?? "4K",
        samBackend: samBackend?.value ?? "roboflow",
        samPrompt: samPrompt?.value ?? "icon,person,robot,animal",
        samApiKey: samApiKeyInput?.value ?? "",
        samCheckpointPath: samCheckpointPathInput?.value ?? "",
        referencePath: uploadedReferencePath,
        referenceUrl: referencePreview?.src ?? "",
        referenceStatus: referenceStatus?.textContent ?? "",
      };
      saveStoredState(INPUT_STATE_KEY, state);
    }

    function applyInputState() {
      const state = loadStoredState(INPUT_STATE_KEY);
      if (!state) {
        return;
      }
      if (typeof state.inputMode === "string" && inputMode) {
        inputMode.value = state.inputMode === "image" ? "image" : "text";
      }
      if (typeof state.methodText === "string" && methodTextInput) {
        methodTextInput.value = state.methodText;
      }
      if (typeof state.provider === "string" && $("provider")) {
        $("provider").value = state.provider;
      }
      if (typeof state.apiKey === "string") {
        $("apiKey").value = state.apiKey;
      }
      if (typeof state.baseUrl === "string" && $("baseUrl")) {
        $("baseUrl").value = state.baseUrl;
      }
      if (typeof state.svgModel === "string" && $("svgModel")) {
        $("svgModel").value = state.svgModel;
      }
      if (typeof state.optimizeIterations === "string" && $("optimizeIterations")) {
        $("optimizeIterations").value = state.optimizeIterations;
      }
      if (typeof state.imageSize === "string" && imageSizeInput) {
        imageSizeInput.value = state.imageSize;
      }
      if (typeof state.samBackend === "string" && samBackend) {
        samBackend.value = state.samBackend;
      }
      if (typeof state.samPrompt === "string" && samPrompt) {
        samPrompt.value = state.samPrompt;
      }
      if (typeof state.samApiKey === "string" && samApiKeyInput) {
        samApiKeyInput.value = state.samApiKey;
      }
      if (typeof state.samCheckpointPath === "string" && samCheckpointPathInput) {
        samCheckpointPathInput.value = state.samCheckpointPath;
      }
      if (typeof state.referencePath === "string" && state.referencePath) {
        uploadedReferencePath = state.referencePath;
      }
      if (
        referencePreview &&
        typeof state.referenceUrl === "string" &&
        state.referenceUrl
      ) {
        referencePreview.src = state.referenceUrl;
        referencePreview.classList.add("visible");
      }
      if (
        referenceStatus &&
        typeof state.referenceStatus === "string" &&
        state.referenceStatus
      ) {
        referenceStatus.textContent = state.referenceStatus;
      }
    }

    function syncModeVisibility() {
      const isImageMode = getMode() === "image";
      const provider = $("provider")?.value ?? "gemini";
      const isLocalVllm = isLocalVllmProvider(provider);
      if (methodFields) {
        methodFields.hidden = isImageMode;
      }
      if (imageSizeGroup) {
        imageSizeGroup.hidden = isImageMode || provider !== "gemini";
      }
      if (uploadLabel) {
        uploadLabel.textContent = isImageMode ? "Source Image" : "Reference Image";
      }
      if (uploadText) {
        uploadText.textContent = isImageMode
          ? "Drop source image here or click to upload"
          : "Drop reference image here or click to upload";
      }
      if (uploadHint) {
        if (isImageMode) {
          uploadHint.textContent = "Required. The uploaded image will be converted directly into SVG.";
        } else if (isLocalVllm) {
          uploadHint.textContent = "local_vllm only supports image-to-SVG. Switch to image mode or choose another provider.";
        } else {
          uploadHint.textContent = "Optional style reference for text-to-image generation.";
        }
      }
      if (referenceStatus && !referenceStatus.textContent.trim()) {
        referenceStatus.textContent = isImageMode
          ? "Upload a source image to enable image-to-SVG mode."
          : "";
      }
      saveInputState();
    }

    function syncImageSizeVisibility() {
      const provider = $("provider")?.value ?? "gemini";
      const show = provider === "gemini" && getMode() !== "image";
      if (imageSizeGroup) {
        imageSizeGroup.hidden = !show;
      }
      saveInputState();
    }

    function syncProviderHints() {
      syncModeVisibility();
      syncImageSizeVisibility();
    }

    function syncSamApiKeyVisibility() {
      const backend = samBackend?.value;
      const shouldShowApiKey = backend === "fal" || backend === "roboflow";
      const shouldShowCheckpoint = backend === "local";
      if (samApiKeyGroup) {
        samApiKeyGroup.hidden = !shouldShowApiKey;
      }
      if (samCheckpointPathGroup) {
        samCheckpointPathGroup.hidden = !shouldShowCheckpoint;
      }
      if (!shouldShowApiKey && samApiKeyInput) {
        samApiKeyInput.value = "";
      }
      if (!shouldShowCheckpoint && samCheckpointPathInput) {
        samCheckpointPathInput.value = "";
      }
      saveInputState();
    }

    applyInputState();

    if (templatePageBtn) {
      templatePageBtn.addEventListener("click", () => {
        window.location.href = "/template.html";
      });
    }

    if (samBackend) {
      samBackend.addEventListener("change", syncSamApiKeyVisibility);
      syncSamApiKeyVisibility();
    }
    if ($("provider")) {
      $("provider").addEventListener("change", syncProviderHints);
      syncProviderHints();
    }
    if (inputMode) {
      inputMode.addEventListener("change", () => {
        errorMsg.textContent = "";
        syncModeVisibility();
        syncImageSizeVisibility();
      });
      syncModeVisibility();
    }

    if (uploadZone && referenceFile) {
      uploadZone.addEventListener("click", () => referenceFile.click());
      uploadZone.addEventListener("dragover", (event) => {
        event.preventDefault();
        uploadZone.classList.add("dragging");
      });
      uploadZone.addEventListener("dragleave", () => {
        uploadZone.classList.remove("dragging");
      });
      uploadZone.addEventListener("drop", async (event) => {
        event.preventDefault();
        uploadZone.classList.remove("dragging");
        const file = event.dataTransfer.files[0];
        if (file) {
          const uploadedRef = await uploadReference(
            file,
            confirmBtn,
            referencePreview,
            referenceStatus,
            getMode()
          );
          if (uploadedRef) {
            uploadedReferencePath = uploadedRef.path;
            saveInputState();
          }
        }
      });
      referenceFile.addEventListener("change", async () => {
        const file = referenceFile.files[0];
        if (file) {
          const uploadedRef = await uploadReference(
            file,
            confirmBtn,
            referencePreview,
            referenceStatus,
            getMode()
          );
          if (uploadedRef) {
            uploadedReferencePath = uploadedRef.path;
            saveInputState();
          }
        }
      });
    }

    const autoSaveFields = [
      inputMode,
      methodTextInput,
      $("provider"),
      $("apiKey"),
      $("baseUrl"),
      $("svgModel"),
      $("optimizeIterations"),
      $("imageSize"),
      samPrompt,
      samApiKeyInput,
      samCheckpointPathInput,
    ];
    for (const field of autoSaveFields) {
      if (!field) {
        continue;
      }
      field.addEventListener("input", saveInputState);
      field.addEventListener("change", saveInputState);
    }

    confirmBtn.addEventListener("click", async () => {
      errorMsg.textContent = "";
      const mode = getMode();
      const provider = $("provider").value;
      const methodText = methodTextInput.value.trim();
      if (mode === "text" && !methodText) {
        errorMsg.textContent = "Please provide method text.";
        return;
      }
      if (isLocalVllmProvider(provider) && mode !== "image") {
        errorMsg.textContent = "local_vllm only supports image-to-SVG. Switch to image mode for Qwen2-VL.";
        return;
      }
      if (mode === "image" && !uploadedReferencePath) {
        errorMsg.textContent = "Please upload a source image.";
        return;
      }

      confirmBtn.disabled = true;
      confirmBtn.textContent = "Starting...";

      const payload = {
        provider,
        api_key: $("apiKey").value.trim() || null,
        base_url: $("baseUrl").value.trim() || null,
        svg_model: $("svgModel").value.trim() || null,
        optimize_iterations: parseInt($("optimizeIterations").value, 10),
        sam_backend: $("samBackend").value,
        sam_prompt: $("samPrompt").value.trim() || null,
        sam_api_key: $("samApiKey").value.trim() || null,
        sam_checkpoint_path: samCheckpointPathInput?.value.trim() || null,
      };
      if (payload.sam_backend === "local") {
        payload.sam_api_key = null;
      }
      if (mode === "image") {
        payload.image_path = uploadedReferencePath;
      } else {
        payload.method_text = methodText;
        payload.reference_image_path = uploadedReferencePath;
        if (provider === "gemini") {
          payload.image_size = imageSizeInput?.value || "4K";
        }
      }
      saveInputState();

      try {
        const response = await fetch(mode === "image" ? "/api/run-image" : "/api/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Request failed");
        }

        const data = await response.json();
        window.location.href = `/canvas.html?job=${encodeURIComponent(data.job_id)}`;
      } catch (err) {
        errorMsg.textContent = err.message || "Failed to start job";
        confirmBtn.disabled = false;
        confirmBtn.textContent = "Confirm -> Canvas";
      }
    });
  }

  function initTemplateInputPage() {
    const confirmBtn = $("confirmBtn");
    const errorMsg = $("errorMsg");
    const uploadZone = $("uploadZone");
    const referenceFile = $("referenceFile");
    const referencePreview = $("referencePreview");
    const referenceStatus = $("referenceStatus");
    const samBackend = $("samBackend");
    const samPrompt = $("samPrompt");
    const samApiKeyGroup = $("samApiKeyGroup");
    const samApiKeyInput = $("samApiKey");
    const samCheckpointPathGroup = $("samCheckpointPathGroup");
    const samCheckpointPathInput = $("samCheckpointPath");
    const backHomeBtn = $("backHomeBtn");
    let uploadedReferencePath = null;

    function saveInputState() {
      const state = {
        provider: $("provider")?.value ?? "gemini",
        apiKey: $("apiKey")?.value ?? "",
        baseUrl: $("baseUrl")?.value ?? "",
        svgModel: $("svgModel")?.value ?? "",
        optimizeIterations: $("optimizeIterations")?.value ?? "0",
        samBackend: samBackend?.value ?? "roboflow",
        samPrompt: samPrompt?.value ?? "icon,person,robot,animal",
        samApiKey: samApiKeyInput?.value ?? "",
        samCheckpointPath: samCheckpointPathInput?.value ?? "",
        referencePath: uploadedReferencePath,
        referenceUrl: referencePreview?.src ?? "",
        referenceStatus: referenceStatus?.textContent ?? "",
      };
      saveStoredState(TEMPLATE_INPUT_STATE_KEY, state);
    }

    function applyInputState() {
      const state = loadStoredState(TEMPLATE_INPUT_STATE_KEY);
      if (!state) {
        return;
      }
      if (typeof state.provider === "string" && $("provider")) {
        $("provider").value = state.provider;
      }
      if (typeof state.apiKey === "string") {
        $("apiKey").value = state.apiKey;
      }
      if (typeof state.baseUrl === "string" && $("baseUrl")) {
        $("baseUrl").value = state.baseUrl;
      }
      if (typeof state.svgModel === "string" && $("svgModel")) {
        $("svgModel").value = state.svgModel;
      }
      if (typeof state.optimizeIterations === "string" && $("optimizeIterations")) {
        $("optimizeIterations").value = state.optimizeIterations;
      }
      if (typeof state.samBackend === "string" && samBackend) {
        samBackend.value = state.samBackend;
      }
      if (typeof state.samPrompt === "string" && samPrompt) {
        samPrompt.value = state.samPrompt;
      }
      if (typeof state.samApiKey === "string" && samApiKeyInput) {
        samApiKeyInput.value = state.samApiKey;
      }
      if (typeof state.samCheckpointPath === "string" && samCheckpointPathInput) {
        samCheckpointPathInput.value = state.samCheckpointPath;
      }
      if (typeof state.referencePath === "string" && state.referencePath) {
        uploadedReferencePath = state.referencePath;
      }
      if (
        referencePreview &&
        typeof state.referenceUrl === "string" &&
        state.referenceUrl
      ) {
        referencePreview.src = state.referenceUrl;
        referencePreview.classList.add("visible");
      }
      if (
        referenceStatus &&
        typeof state.referenceStatus === "string" &&
        state.referenceStatus
      ) {
        referenceStatus.textContent = state.referenceStatus;
      }
    }

    function syncSamApiKeyVisibility() {
      const backend = samBackend?.value;
      const shouldShowApiKey = backend === "fal" || backend === "roboflow";
      const shouldShowCheckpoint = backend === "local";
      if (samApiKeyGroup) {
        samApiKeyGroup.hidden = !shouldShowApiKey;
      }
      if (samCheckpointPathGroup) {
        samCheckpointPathGroup.hidden = !shouldShowCheckpoint;
      }
      if (!shouldShowApiKey && samApiKeyInput) {
        samApiKeyInput.value = "";
      }
      if (!shouldShowCheckpoint && samCheckpointPathInput) {
        samCheckpointPathInput.value = "";
      }
      saveInputState();
    }

    applyInputState();

    function syncTemplateProviderHints() {
      saveInputState();
    }

    if (backHomeBtn) {
      backHomeBtn.addEventListener("click", () => {
        window.location.href = "/";
      });
    }
    if (samBackend) {
      samBackend.addEventListener("change", syncSamApiKeyVisibility);
      syncSamApiKeyVisibility();
    }
    if ($("provider")) {
      $("provider").addEventListener("change", syncTemplateProviderHints);
      syncTemplateProviderHints();
    }

    if (uploadZone && referenceFile) {
      uploadZone.addEventListener("click", () => referenceFile.click());
      uploadZone.addEventListener("dragover", (event) => {
        event.preventDefault();
        uploadZone.classList.add("dragging");
      });
      uploadZone.addEventListener("dragleave", () => {
        uploadZone.classList.remove("dragging");
      });
      uploadZone.addEventListener("drop", async (event) => {
        event.preventDefault();
        uploadZone.classList.remove("dragging");
        const file = event.dataTransfer.files[0];
        if (file) {
          const uploadedRef = await uploadReference(
            file,
            confirmBtn,
            referencePreview,
            referenceStatus,
            "image"
          );
          if (uploadedRef) {
            uploadedReferencePath = uploadedRef.path;
            saveInputState();
          }
        }
      });
      referenceFile.addEventListener("change", async () => {
        const file = referenceFile.files[0];
        if (file) {
          const uploadedRef = await uploadReference(
            file,
            confirmBtn,
            referencePreview,
            referenceStatus,
            "image"
          );
          if (uploadedRef) {
            uploadedReferencePath = uploadedRef.path;
            saveInputState();
          }
        }
      });
    }

    const autoSaveFields = [
      $("provider"),
      $("apiKey"),
      $("baseUrl"),
      $("svgModel"),
      $("optimizeIterations"),
      samBackend,
      samPrompt,
      samApiKeyInput,
      samCheckpointPathInput,
    ];
    for (const field of autoSaveFields) {
      if (!field) {
        continue;
      }
      field.addEventListener("input", saveInputState);
      field.addEventListener("change", saveInputState);
    }

    confirmBtn.addEventListener("click", async () => {
      errorMsg.textContent = "";
      if (!uploadedReferencePath) {
        errorMsg.textContent = "Please upload a source image.";
        return;
      }

      confirmBtn.disabled = true;
      confirmBtn.textContent = "Starting...";

      const payload = {
        image_path: uploadedReferencePath,
        provider: $("provider").value,
        api_key: $("apiKey").value.trim() || null,
        base_url: $("baseUrl").value.trim() || null,
        svg_model: $("svgModel").value.trim() || null,
        optimize_iterations: parseInt($("optimizeIterations").value, 10),
        sam_backend: $("samBackend").value,
        sam_prompt: $("samPrompt").value.trim() || null,
        sam_api_key: $("samApiKey").value.trim() || null,
        sam_checkpoint_path: samCheckpointPathInput?.value.trim() || null,
        stop_after: 4,
      };
      if (payload.sam_backend === "local") {
        payload.sam_api_key = null;
      }
      saveInputState();

      try {
        const response = await fetch("/api/run-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Request failed");
        }

        const data = await response.json();
        window.location.href = `/canvas.html?job=${encodeURIComponent(data.job_id)}&mode=template`;
      } catch (err) {
        errorMsg.textContent = err.message || "Failed to start job";
        confirmBtn.disabled = false;
        confirmBtn.textContent = "Generate Template -> Editor";
      }
    });
  }

  async function uploadReference(file, confirmBtn, previewEl, statusEl, mode = "text") {
    if (!file.type.startsWith("image/")) {
      statusEl.textContent = "Only image files are supported.";
      return null;
    }

    confirmBtn.disabled = true;
    statusEl.textContent = mode === "image" ? "Uploading source image..." : "Uploading reference...";

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Upload failed");
      }

      const data = await response.json();
      statusEl.textContent =
        mode === "image"
          ? `Using uploaded source image: ${data.name}`
          : `Using uploaded reference: ${data.name}`;
      if (previewEl) {
        previewEl.src = data.url || "";
        previewEl.classList.add("visible");
      }
      return {
        path: data.path || null,
        url: data.url || "",
        name: data.name || "",
      };
    } catch (err) {
      statusEl.textContent = err.message || "Upload failed";
      return null;
    } finally {
      confirmBtn.disabled = false;
    }
  }

  async function initCanvasPage() {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("job");
    const canvasMode = params.get("mode") === "template" ? "template" : "default";
    const isTemplateMode = canvasMode === "template";
    const totalSteps = isTemplateMode ? 4 : 5;
    const statusText = $("statusText");
    const jobIdEl = $("jobId");
    const artifactPanel = $("artifactPanel");
    const artifactList = $("artifactList");
    const toggle = $("artifactToggle");
    const logToggle = $("logToggle");
    const exportSvgBtn = $("exportSvgBtn");
    const backToConfigBtn = $("backToConfigBtn");
    const logPanel = $("logPanel");
    const logBody = $("logBody");
    const iframe = $("svgEditorFrame");
    const fallback = $("svgFallback");
    const fallbackObject = $("fallbackObject");

    if (!jobId) {
      statusText.textContent = "Missing job id";
      return;
    }

    jobIdEl.textContent = jobId;

    toggle.addEventListener("click", () => {
      artifactPanel.classList.toggle("open");
    });

    logToggle.addEventListener("click", () => {
      logPanel.classList.toggle("open");
    });
    if (backToConfigBtn) {
      backToConfigBtn.addEventListener("click", () => {
        window.location.href = isTemplateMode ? "/template.html" : "/";
      });
    }

    let svgEditAvailable = false;
    let svgEditPath = null;
    try {
      const configRes = await fetch("/api/config");
      if (configRes.ok) {
        const config = await configRes.json();
        svgEditAvailable = Boolean(config.svgEditAvailable);
        svgEditPath = config.svgEditPath || null;
      }
    } catch (err) {
      svgEditAvailable = false;
    }

    if (svgEditAvailable && svgEditPath) {
      iframe.src = svgEditPath;
    } else {
      fallback.classList.add("active");
      iframe.style.display = "none";
    }

    let svgReady = false;
    let pendingSvgText = null;
    let latestSvgText = "";
    let latestSvgUrl = "";
    let latestSvgPriority = 0;

    iframe.addEventListener("load", () => {
      svgReady = true;
      if (pendingSvgText) {
        tryLoadSvg(pendingSvgText);
        pendingSvgText = null;
      }
    });

    const stepMap = {
      figure: { step: 1, label: "Source image ready", priority: 1 },
      samed: { step: 2, label: "SAM3 segmentation", priority: 1 },
      icon_raw: { step: 3, label: "Icons extracted", priority: 1 },
      icon_nobg: { step: 3, label: "Icons refined", priority: 2 },
      template_svg: { step: 4, label: "Template SVG ready", priority: 1 },
      optimized_template_svg: { step: 4, label: "Optimized template SVG ready", priority: 2 },
      final_svg: { step: 5, label: "Final SVG ready", priority: 1 },
    };

    let currentStep = 0;
    let currentStepPriority = 0;

    const artifacts = new Set();
    const eventSource = new EventSource(`/api/events/${jobId}`);
    let isFinished = false;

    eventSource.addEventListener("artifact", async (event) => {
      const data = JSON.parse(event.data);
      if (!artifacts.has(data.path)) {
        artifacts.add(data.path);
        addArtifactCard(artifactList, data);
      }

      const svgPriority = getSvgLoadPriority(data.kind, isTemplateMode);
      if (svgPriority > 0 && svgPriority >= latestSvgPriority) {
        latestSvgPriority = svgPriority;
        await loadSvgAsset(data.url);
      }

      const stepInfo = stepMap[data.kind];
      if (
        stepInfo &&
        (!isTemplateMode || data.kind !== "final_svg") &&
        (stepInfo.step > currentStep ||
          (stepInfo.step === currentStep && stepInfo.priority > currentStepPriority))
      ) {
        currentStep = stepInfo.step;
        currentStepPriority = stepInfo.priority;
        statusText.textContent = `Step ${currentStep}/${totalSteps} - ${stepInfo.label}`;
      }
    });

    eventSource.addEventListener("status", (event) => {
      const data = JSON.parse(event.data);
      if (data.state === "started") {
        statusText.textContent = "Running";
      } else if (data.state === "finished") {
        isFinished = true;
        if (typeof data.code === "number" && data.code !== 0) {
          statusText.textContent = `Failed (code ${data.code})`;
        } else {
          statusText.textContent = "Done";
        }
      }
    });

    eventSource.addEventListener("log", (event) => {
      const data = JSON.parse(event.data);
      appendLogLine(logBody, data);
    });

    eventSource.onerror = () => {
      if (isFinished) {
        eventSource.close();
        return;
      }
      statusText.textContent = "Disconnected";
    };

    if (exportSvgBtn) {
      exportSvgBtn.addEventListener("click", async () => {
        exportSvgBtn.disabled = true;
        try {
          const svgText = await getCurrentSvgText();
          if (!svgText) {
            throw new Error("No SVG available to export yet.");
          }
          const filename = isTemplateMode ? `${jobId}-template-edited.svg` : `${jobId}-edited.svg`;
          downloadSvg(filename, svgText);
        } catch (err) {
          statusText.textContent = err.message || "Failed to export SVG";
        } finally {
          exportSvgBtn.disabled = false;
        }
      });
    }

    async function loadSvgAsset(url) {
      let svgText = "";
      try {
        const response = await fetch(url);
        svgText = await response.text();
      } catch (err) {
        return;
      }

      latestSvgText = svgText;
      latestSvgUrl = url;

      if (svgEditAvailable) {
        if (!svgEditPath) {
          return;
        }
        if (!svgReady) {
          pendingSvgText = svgText;
          return;
        }

        const loaded = tryLoadSvg(svgText);
        if (!loaded) {
          iframe.src = `${svgEditPath}?url=${encodeURIComponent(url)}`;
        }
      } else {
        fallbackObject.data = url;
      }
    }

    function tryLoadSvg(svgText) {
      if (!iframe.contentWindow) {
        return false;
      }

      const win = iframe.contentWindow;
      if (win.svgEditor && typeof win.svgEditor.loadFromString === "function") {
        win.svgEditor.loadFromString(svgText);
        return true;
      }
      if (win.svgCanvas && typeof win.svgCanvas.setSvgString === "function") {
        win.svgCanvas.setSvgString(svgText);
        return true;
      }
      return false;
    }

    async function getCurrentSvgText() {
      if (iframe.contentWindow) {
        const win = iframe.contentWindow;
        const editorCanvas = win.svgEditor?.svgCanvas;
        if (editorCanvas && typeof editorCanvas.getSvgString === "function") {
          return editorCanvas.getSvgString();
        }
        if (win.svgCanvas && typeof win.svgCanvas.getSvgString === "function") {
          return win.svgCanvas.getSvgString();
        }
      }

      if (latestSvgText) {
        return latestSvgText;
      }

      if (latestSvgUrl) {
        const response = await fetch(latestSvgUrl);
        if (!response.ok) {
          throw new Error("Failed to reload SVG for export.");
        }
        latestSvgText = await response.text();
        return latestSvgText;
      }

      return "";
    }
  }

  function getSvgLoadPriority(kind, isTemplateMode) {
    if (kind === "template_svg") {
      return 1;
    }
    if (kind === "optimized_template_svg") {
      return 2;
    }
    if (!isTemplateMode && kind === "final_svg") {
      return 3;
    }
    return 0;
  }

  function downloadSvg(filename, svgText) {
    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function appendLogLine(container, data) {
    const line = `[${data.stream}] ${data.line}`;
    const lines = container.textContent.split("\n").filter(Boolean);
    lines.push(line);
    if (lines.length > 200) {
      lines.splice(0, lines.length - 200);
    }
    container.textContent = lines.join("\n");
    container.scrollTop = container.scrollHeight;
  }

  function addArtifactCard(container, data) {
    const card = document.createElement("a");
    card.className = "artifact-card";
    card.href = data.url;
    card.target = "_blank";
    card.rel = "noreferrer";

    const img = document.createElement("img");
    img.src = data.url;
    img.alt = data.name;
    img.loading = "lazy";

    const meta = document.createElement("div");
    meta.className = "artifact-meta";

    const name = document.createElement("div");
    name.className = "artifact-name";
    name.textContent = data.name;

    const badge = document.createElement("div");
    badge.className = "artifact-badge";
    badge.textContent = formatKind(data.kind);

    meta.appendChild(name);
    meta.appendChild(badge);
    card.appendChild(img);
    card.appendChild(meta);
    container.prepend(card);
  }

  function formatKind(kind) {
    switch (kind) {
      case "figure":
        return "figure";
      case "samed":
        return "samed";
      case "icon_raw":
        return "icon raw";
      case "icon_nobg":
        return "icon no-bg";
      case "template_svg":
        return "template";
      case "optimized_template_svg":
        return "opt template";
      case "final_svg":
        return "final";
      default:
        return "artifact";
    }
  }
})();
