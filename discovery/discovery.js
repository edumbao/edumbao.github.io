// Plug in your Formspree or Web3Forms form endpoint,
// e.g. https://formspree.io/f/xxxx or https://api.web3forms.com/submit
//
// Formspree:
//   1. Create a form at https://formspree.io
//   2. Set DISCOVERY_FORM_ENDPOINT to https://formspree.io/f/yourFormId
//   3. Leave DISCOVERY_FORM_ACCESS_KEY as an empty string
//
// Web3Forms:
//   1. Create an access key at https://web3forms.com
//   2. Set DISCOVERY_FORM_ENDPOINT to https://api.web3forms.com/submit
//   3. Set DISCOVERY_FORM_ACCESS_KEY to that key
//
// This repository is public. Do not commit a real secret you cannot rotate.
// Web3Forms keys shipped in a static page are visible to anyone who can
// load the script; restrict the key to edumbao.com in the Web3Forms dashboard.
// While DISCOVERY_FORM_ENDPOINT is empty, Submit still validates and shows
// an on-page notice that nothing was sent.
const DISCOVERY_FORM_ENDPOINT = "https://formspree.io/f/mljbdora";

// Web3Forms access key. Leave empty when using Formspree.
const DISCOVERY_FORM_ACCESS_KEY = "";

(function () {
  const form = document.getElementById("discovery-form");
  const intro = document.getElementById("questions-intro");
  const confirmation = document.getElementById("confirmation");
  const confirmationKicker = document.getElementById("confirmation-kicker");
  const confirmationTitle = document.getElementById("confirmation-title");
  const confirmationBody = document.getElementById("confirmation-body");
  const summary = document.getElementById("form-summary");
  const summaryList = document.getElementById("form-summary-list");
  const submitError = document.getElementById("submit-error");
  const submitButton = document.getElementById("submit-intake");
  const backButton = document.getElementById("back-to-form");

  if (!form || !intro || !confirmation || !submitButton || !backButton) {
    return;
  }

  const submitLabel = submitButton.textContent.trim();

  function fieldValue(name) {
    const field = form.elements.namedItem(name);

    if (!field || typeof field.value !== "string") {
      return "";
    }

    return field.value.trim();
  }

  function endpointUrl(value) {
    try {
      const url = new URL(value);

      if (url.protocol !== "https:" && url.protocol !== "http:") {
        return null;
      }

      return url.href;
    } catch (error) {
      return null;
    }
  }

  function clearErrors() {
    form.querySelectorAll("[aria-invalid]").forEach(function (node) {
      node.removeAttribute("aria-invalid");
    });

    form.querySelectorAll(".field-error").forEach(function (node) {
      node.textContent = "";
    });

    summary.hidden = true;
    summaryList.replaceChildren();
    submitError.hidden = true;
    submitError.textContent = "";
  }

  function validate() {
    const problems = [];

    function problem(focusId, errorId, invalidId, message) {
      problems.push({
        focusId: focusId,
        errorId: errorId,
        invalidId: invalidId,
        message: message,
      });
    }

    if (!fieldValue("company_name")) {
      problem(
        "company-name",
        "company-name-error",
        "company-name",
        "Enter the company name."
      );
    }

    const website = fieldValue("website_url");

    if (!website) {
      problem(
        "website-url",
        "website-url-error",
        "website-url",
        "Enter the website URL."
      );
    } else if (
      !/^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?$/i.test(website)
    ) {
      problem(
        "website-url",
        "website-url-error",
        "website-url",
        "Enter a website URL, such as https://example.com.au."
      );
    }

    if (!fieldValue("contact_name")) {
      problem(
        "contact-name",
        "contact-name-error",
        "contact-name",
        "Enter your name."
      );
    }

    const email = fieldValue("work_email");

    if (!email) {
      problem(
        "work-email",
        "work-email-error",
        "work-email",
        "Enter your work email."
      );
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      problem(
        "work-email",
        "work-email-error",
        "work-email",
        "Enter a valid work email."
      );
    }

    if (!fieldValue("core_offer")) {
      problem(
        "core-offer",
        "core-offer-error",
        "core-offer",
        "Describe the core offer and target Australian market."
      );
    }

    if (!fieldValue("primary_objective")) {
      problem(
        "objective-leads",
        "primary-objective-error",
        "primary-objective",
        "Select a primary 90-day objective."
      );
    }

    if (!fieldValue("retainer_range")) {
      problem(
        "retainer-foundation",
        "retainer-range-error",
        "retainer-range",
        "Select an estimated monthly retainer range."
      );
    }

    return problems;
  }

  function forgetSummary(focusId) {
    summaryList.querySelectorAll("a").forEach(function (link) {
      if (link.getAttribute("href") !== "#" + focusId) {
        return;
      }

      if (link.parentElement) {
        link.parentElement.remove();
      }
    });

    if (!summaryList.children.length) {
      summary.hidden = true;
    }
  }

  function showProblems(problems) {
    problems.forEach(function (item) {
      const errorNode = document.getElementById(item.errorId);
      const invalidNode = document.getElementById(item.invalidId);

      if (errorNode) {
        errorNode.textContent = item.message;
      }

      if (invalidNode) {
        invalidNode.setAttribute("aria-invalid", "true");
      }

      const listItem = document.createElement("li");
      const link = document.createElement("a");

      link.href = "#" + item.focusId;
      link.textContent = item.message;
      listItem.appendChild(link);
      summaryList.appendChild(listItem);
    });

    summary.hidden = false;
    summary.scrollIntoView({ block: "start" });
    summary.focus({ preventScroll: true });
  }

  function showSubmitError(message) {
    submitError.hidden = false;
    submitError.textContent = message;
    submitError.focus();
  }

  function showConfirmation(mode) {
    if (mode === "unconfigured") {
      confirmationKicker.textContent = "Ready to connect";
      confirmationTitle.textContent = "Intake checked — not sent yet";
      confirmationBody.textContent =
        "Your answers passed validation, and the form is ready. No delivery endpoint is connected yet, so nothing was sent.";
    } else {
      confirmationKicker.textContent = "Sent";
      confirmationTitle.textContent = "Intake received";
      confirmationBody.textContent =
        "Thank you. Ed Umbao’s specialist pod has your campaign intake and will use it to prepare a tailored proposal in AUD.";
    }

    intro.hidden = true;
    form.hidden = true;
    confirmation.hidden = false;
    confirmation.scrollIntoView({ block: "start" });
    confirmationTitle.focus({ preventScroll: true });
  }

  function serviceDetail(payload) {
    if (!payload || typeof payload !== "object") {
      return "";
    }

    const raw = payload.message || payload.error || "";

    if (typeof raw !== "string") {
      return "";
    }

    const clean = raw.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

    if (!clean) {
      return "";
    }

    return clean.slice(0, 180);
  }

  form.addEventListener("input", function (event) {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    target.removeAttribute("aria-invalid");

    if (target.id) {
      forgetSummary(target.id);
    }

    if (target.name === "primary_objective") {
      forgetSummary("objective-leads");
    }

    if (target.name === "retainer_range") {
      forgetSummary("retainer-foundation");
    }

    const describedBy = target.getAttribute("aria-describedby") || "";

    describedBy.split(/\s+/).forEach(function (id) {
      if (!id.endsWith("-error")) {
        return;
      }

      const node = document.getElementById(id);

      if (node) {
        node.textContent = "";
      }
    });

    const group = target.closest("fieldset[aria-invalid]");

    if (group) {
      group.removeAttribute("aria-invalid");

      const groupErrorId = (group.getAttribute("aria-describedby") || "")
        .split(/\s+/)
        .find(function (id) {
          return id.endsWith("-error");
        });
      const groupError = groupErrorId
        ? document.getElementById(groupErrorId)
        : null;

      if (groupError) {
        groupError.textContent = "";
      }
    }
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearErrors();

    const problems = validate();

    if (problems.length) {
      showProblems(problems);
      return;
    }

    const endpoint = endpointUrl((DISCOVERY_FORM_ENDPOINT || "").trim());

    if (!(DISCOVERY_FORM_ENDPOINT || "").trim()) {
      showConfirmation("unconfigured");
      return;
    }

    if (!endpoint) {
      showSubmitError(
        "The form endpoint is not a valid http(s) URL, so nothing was sent. Your answers are still here."
      );
      return;
    }

    const isWeb3 = /web3forms\.com/i.test(endpoint);
    const accessKey = (DISCOVERY_FORM_ACCESS_KEY || "").trim();

    if (isWeb3 && !accessKey) {
      showSubmitError(
        "Web3Forms needs an access key. Add DISCOVERY_FORM_ACCESS_KEY in discovery/discovery.js and try again. Your answers are still here."
      );
      return;
    }

    const data = new FormData(form);
    const subject =
      "Discovery intake: " + (fieldValue("company_name") || "New client");

    data.set("subject", subject);
    data.set("_subject", subject);
    data.set("_replyto", fieldValue("work_email"));

    if (isWeb3) {
      data.set("access_key", accessKey);
      data.set("email", fieldValue("work_email"));
      data.set("name", fieldValue("contact_name"));
    }

    submitButton.disabled = true;
    submitButton.textContent = "Sending…";
    form.setAttribute("aria-busy", "true");

    fetch(endpoint, {
      method: "POST",
      body: data,
      headers: {
        Accept: "application/json",
      },
      credentials: "omit",
    })
      .then(function (response) {
        return response.json().catch(function () {
          return null;
        }).then(function (payload) {
          return {
            ok: response.ok,
            payload: payload,
          };
        });
      })
      .then(function (result) {
        const rejected = result.payload && result.payload.success === false;

        if (!result.ok || rejected) {
          const detail = serviceDetail(result.payload);
          const message = detail
            ? "The form could not be sent. The delivery service said: " +
              detail +
              " Your answers are still here."
            : "The form could not be sent. The delivery service returned an error. Your answers are still here.";

          showSubmitError(message);
          return;
        }

        showConfirmation("sent");
      })
      .catch(function () {
        showSubmitError(
          "The form could not be sent. Check your connection and try again. Your answers are still here."
        );
      })
      .finally(function () {
        submitButton.disabled = false;
        submitButton.textContent = submitLabel;
        form.removeAttribute("aria-busy");
      });
  });

  backButton.addEventListener("click", function () {
    confirmation.hidden = true;
    intro.hidden = false;
    form.hidden = false;
    submitButton.scrollIntoView({ block: "center" });
    submitButton.focus({ preventScroll: true });
  });
})();
