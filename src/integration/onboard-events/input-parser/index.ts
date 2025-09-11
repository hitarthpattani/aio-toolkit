/**
 * <license header>
 */

import type {
  OnboardEventsInput,
  OnboardProvider,
  OnboardRegistration,
  OnboardEvent,
  ParsedEntities,
  ParsedProvider,
  ParsedRegistration,
  ParsedEvent,
} from '../types';

/**
 * InputParser - Parses and extracts entities from OnboardEventsInput data
 */
class InputParser {
  private entities: ParsedEntities = {
    providers: [],
    registrations: [],
    events: [],
  };

  constructor(input: OnboardEventsInput) {
    for (const provider of input.providers) {
      // Add provider
      this.entities.providers.push(this.createProviderEntity(provider));

      // Add registrations and events
      for (const registration of provider.registrations) {
        this.entities.registrations.push(this.createRegistrationEntity(registration, provider.key));

        for (const event of registration.events) {
          this.entities.events.push(this.createEventEntity(event, registration.key, provider.key));
        }
      }
    }
  }

  /**
   * Create provider entity structure
   */
  private createProviderEntity(provider: OnboardProvider): ParsedProvider {
    return {
      key: provider.key,
      label: provider.label,
      description: provider.description,
      docsUrl: provider.docsUrl,
    };
  }

  /**
   * Create registration entity structure
   */
  private createRegistrationEntity(
    registration: OnboardRegistration,
    providerKey: string
  ): ParsedRegistration {
    return {
      key: registration.key,
      label: registration.label,
      description: registration.description,
      providerKey: providerKey,
    };
  }

  /**
   * Create event entity structure
   */
  private createEventEntity(
    event: OnboardEvent,
    registrationKey: string,
    providerKey: string
  ): ParsedEvent {
    return {
      eventCode: event.eventCode,
      runtimeAction: event.runtimeAction,
      deliveryType: event.deliveryType,
      sampleEventTemplate: event.sampleEventTemplate,
      registrationKey: registrationKey,
      providerKey: providerKey,
    };
  }

  getEntities(): ParsedEntities {
    return this.entities;
  }
}

export default InputParser;
