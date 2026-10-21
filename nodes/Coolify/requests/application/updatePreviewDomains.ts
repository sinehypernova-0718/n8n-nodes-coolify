import { type IDataObject, type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireApplicationUuid } from './parameters';

/**
 * Mode that sends the domains of an application that is not built from a
 * Docker Compose file.
 */
export const PREVIEW_DOMAINS_MODE_APPLICATION = 'application';

/**
 * Mode that sends the domains per service of an application that is built from
 * a Docker Compose file.
 */
export const PREVIEW_DOMAINS_MODE_DOCKER_COMPOSE = 'dockerCompose';

/**
 * Build the request that replaces the domains of a preview deployment.
 *
 * The Coolify API replaces the domains, it does not merge them, and it accepts
 * two different forms of the request: the domains of an application that is not
 * built from a Docker Compose file and the domains per service of an
 * application that is. The API rejects a request that carries the fields of the
 * other form.
 *
 * The node cannot read the kind of the application, so the request form is
 * chosen by the mode of the operation and never by the fields that happen to
 * be filled in. Both forms replace the current domains, so removing a domain
 * is always an explicit act.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `PATCH /applications/{uuid}/previews/{pull_request_id}`.
 */
export async function updatePreviewDomainsRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(
		this,
		itemIndex,
		'update the domains of a preview deployment',
	);

	const pullRequestId = this.getNodeParameter('pullRequestId', itemIndex) as number;
	if (!Number.isInteger(pullRequestId) || pullRequestId < 1 || pullRequestId > 2_147_483_647) {
		throw new NodeOperationError(
			this.getNode(),
			'Pull Request ID must be an integer between 1 and 2147483647',
			{ itemIndex },
		);
	}

	const mode = this.getNodeParameter('mode', itemIndex) as string;

	const body: IDataObject = {};

	if (mode === PREVIEW_DOMAINS_MODE_DOCKER_COMPOSE) {
		const composeDomains = this.getNodeParameter(
			'dockerComposeDomains',
			itemIndex,
			[],
		) as IDataObject[];

		if (!Array.isArray(composeDomains) || composeDomains.length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				'At least one Docker Compose service domain is required',
				{ itemIndex },
			);
		}

		body.docker_compose_domains = composeDomains.map((entry) => {
			const name = typeof entry.name === 'string' ? entry.name.trim() : '';

			if (!name) {
				throw new NodeOperationError(
					this.getNode(),
					'Every Docker Compose domain needs the name of its service',
					{ itemIndex },
				);
			}

			const domain = typeof entry.domain === 'string' ? entry.domain.trim() : '';
			if (!domain) {
				throw new NodeOperationError(
					this.getNode(),
					`The Docker Compose service "${name}" needs a domain, otherwise its current domain is removed`,
					{ itemIndex },
				);
			}

			const service: IDataObject = { name, domain };

			const redirect = typeof entry.redirect === 'string' ? entry.redirect : '';
			if (redirect !== '') {
				service.redirect = redirect;
			}

			return service;
		});
	} else {
		const removeDomains = this.getNodeParameter('removeDomains', itemIndex, false) === true;

		if (removeDomains) {
			body.domains = '';
		} else {
			const domains = (this.getNodeParameter('domains', itemIndex, '') as string).trim();

			if (!domains) {
				throw new NodeOperationError(
					this.getNode(),
					'Enter the domains of the preview deployment, or switch on Remove Domains to remove the current domains',
					{ itemIndex },
				);
			}

			body.domains = domains;
		}
	}

	if (this.getNodeParameter('forceDomainOverride', itemIndex, false) === true) {
		body.force_domain_override = true;
	}

	return {
		method: 'PATCH',
		path: `applications/${applicationUuid}/previews/${pullRequestId}`,
		body,
	};
}
